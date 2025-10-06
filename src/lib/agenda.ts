import { supabase } from './supabaseClient';
import { programarUna, programarSemanales, asegurarPermisoNotificaciones } from './notifications';
import { LocalNotifications, PendingLocalNotificationSchema } from '@capacitor/local-notifications';

export type AgendaEvent = {
  id: string;
  user_id: string;
  type: 'medicamento'|'cita_medica'|'otro';
  title: string;
  description?: string | null;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:MM:SS
  notify?: boolean | null;
  repeat_type?: 'none'|'daily'|'weekly'|'monthly' | null;
  repeat_until?: string | null; // YYYY-MM-DD
};

export function toLocalDate(event_date: string, event_time: string) {
  const [y,m,d] = event_date.split('-').map(Number);
  const [hh,mm,ss] = event_time.split(':').map(Number);
  return new Date(y, (m-1), d, hh, mm, ss||0);
}

function idFromUuid(uuid: string): number {
  // usa primeros 8 hex como entero 32-bit
  const hex = uuid.replace(/-/g, '').slice(0,8);
  return parseInt(hex, 16) % 2147483647; // dentro de 32-bit int
}

export async function fetchUpcomingAgenda(daysAhead = 30) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) return [] as AgendaEvent[];
  // Normaliza a fecha local para evitar desfasar por huso horario
  const today = new Date();
  const to = new Date(); to.setDate(today.getDate()+daysAhead);
  const fromStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0,10);
  const toStr = new Date(to.getFullYear(), to.getMonth(), to.getDate()).toISOString().slice(0,10);
  const { data } = await supabase
    .from('agenda_events')
    .select('*')
    .eq('user_id', uid)
    .gte('event_date', fromStr)
    .lte('event_date', toStr)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });
  return (data || []) as AgendaEvent[];
}

export async function fetchAgendaRange(start: Date, end: Date) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) return [] as AgendaEvent[];
  // Asegura rangos por fecha local
  const fromLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const toLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const fromStr = fromLocal.toISOString().slice(0,10);
  const toStr = toLocal.toISOString().slice(0,10);
  const { data } = await supabase
    .from('agenda_events')
    .select('*')
    .eq('user_id', uid)
    .gte('event_date', fromStr)
    .lte('event_date', toStr)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });
  return (data || []) as AgendaEvent[];
}

export async function createAgendaEvent(input: Omit<AgendaEvent,'id'|'user_id'>) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) throw new Error('No hay sesión');
  const { data, error } = await supabase.from('agenda_events').insert({
    user_id: uid,
    ...input,
  }).select('*').single();
  if (error) throw error;
  const ev = data as AgendaEvent;
  try { await scheduleNotificationForEvent(ev); } catch {}
  return ev;
}

export async function deleteAgendaEvent(id: string) {
  // Intenta cancelar notificaciones locales asociadas antes de borrar
  try {
    const ev = await getEventById(id);
    if (ev) await cancelNotificationsForEvent(ev);
  } catch {}
  await supabase.from('agenda_events').delete().eq('id', id);
}

export async function scheduleNotificationForEvent(ev: AgendaEvent) {
  if (!ev.notify) return;
  const ok = await asegurarPermisoNotificaciones();
  if (!ok) return;
  const when = toLocalDate(ev.event_date, ev.event_time);
  const id = idFromUuid(ev.id);
  const titulo = ev.type === 'medicamento' ? 'Recordatorio de medicamento' : ev.type === 'cita_medica' ? 'Cita médica' : 'Recordatorio';
  const cuerpo = ev.title;

  const rpt = (ev.repeat_type||'none').toLowerCase();
  if (rpt === 'none') {
    await programarUna({ id, titulo, cuerpo, fecha: when });
  } else if (rpt === 'daily') {
    // programa los 7 días a la misma hora como repetitivos semanales (equivalente a diario)
    await programarSemanales({ idBase: id, titulo, cuerpo, hora: when.getHours(), minuto: when.getMinutes(), diasSemana: [1,2,3,4,5,6,7] });
  } else if (rpt === 'weekly') {
    const wd = ((when.getDay()+1) as 1|2|3|4|5|6|7); // 1=Dom..7=Sáb
    await programarSemanales({ idBase: id, titulo, cuerpo, hora: when.getHours(), minuto: when.getMinutes(), diasSemana: [wd] });
  } else if (rpt === 'monthly') {
    // simplificado: única notificación este mes; el usuario podrá duplicar para próximos meses
    await programarUna({ id, titulo, cuerpo, fecha: when });
  }
}

// === Nuevas utilidades: lectura, actualización y cancelación de notificaciones asociadas ===

export async function getEventById(id: string): Promise<AgendaEvent | null> {
  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as AgendaEvent;
}

export async function updateAgendaEvent(id: string, patch: Partial<Omit<AgendaEvent,'id'|'user_id'>>) {
  // Trae el evento anterior para cancelar notificaciones si cambian
  const prev = await getEventById(id);
  const { data, error } = await supabase
    .from('agenda_events')
    .update({ ...patch })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  const updated = data as AgendaEvent;
  try {
    if (prev) await cancelNotificationsForEvent(prev);
    await scheduleNotificationForEvent(updated);
  } catch {}
  return updated;
}

export async function cancelNotificationsForEvent(ev: AgendaEvent) {
  const base = idFromUuid(ev.id);
  const rpt = (ev.repeat_type || 'none').toLowerCase();
  let ids: number[] = [];
  if (rpt === 'none' || rpt === 'monthly') {
    ids = [base];
  } else if (rpt === 'weekly') {
    ids = [base]; // usamos base como id único para semanal
  } else if (rpt === 'daily') {
    ids = Array.from({length:7}, (_,i)=> base + i);
  }
  if (ids.length) {
    const list: PendingLocalNotificationSchema[] = ids.map(id => ({ id } as any));
    try { await LocalNotifications.cancel({ notifications: list }); } catch {}
  }
}
