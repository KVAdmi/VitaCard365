import { supabase } from './supabaseClient';
import { programarUna, programarSemanales, asegurarPermisoNotificaciones } from './notifications';

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
  const today = new Date();
  const to = new Date(); to.setDate(today.getDate()+daysAhead);
  const fromStr = today.toISOString().slice(0,10);
  const toStr = to.toISOString().slice(0,10);
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
  await supabase.from('agenda_events').delete().eq('id', id);
  // cancelar local si existía: fuera de alcance por ahora (requeriría guardar ids asignados)
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
