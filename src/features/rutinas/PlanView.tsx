import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { ensureAccess } from '@/lib/access';
import { dateKeyMX } from '@/lib/tz';

type RutinaDia = {
  id: string;
  dia_semana: number;
  foco: string;
  minutos: number;
  items?: Array<{
    rutina_id: string;
    ejercicio_id: string;
    series: number;
    reps: number | null;
    tiempo_seg: number | null;
    descanso_seg: number | null;
    nombre?: string;
  }>
};

const NeonCard: React.FC<React.PropsWithChildren<{className?: string, hoverable?: boolean}>> = ({ className='', hoverable=false, children }) => (
  <div
    className={`group relative rounded-2xl border bg-white/5 border-cyan-300/20 p-4 shadow-[0_20px_40px_rgba(0,40,80,0.35)] ${hoverable ? 'transition-all duration-300 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)]' : ''} ${className}`}
    style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
  >
    <style>{`@keyframes neonPulseSoft {0%,100%{box-shadow:0 0 0 1px rgba(0,255,231,0.28),0 0 18px rgba(0,255,231,0.12)}50%{box-shadow:0 0 0 1px rgba(0,255,231,0.42),0 0 24px rgba(0,255,231,0.18)}}`}</style>
    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30" />
    <div className="relative z-10">{children}</div>
  </div>
);

export default function PlanView() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any|null>(null);
  const [dias, setDias] = useState<RutinaDia[]>([]);
  const [doneToday, setDoneToday] = useState<Record<string, boolean>>({});
  const [allowed, setAllowed] = useState<boolean>(true);
  const [hideDoneToday, setHideDoneToday] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    // Guard de acceso suave: no bloqueamos la vista del plan
    const { allowed: can } = await ensureAccess().catch(() => ({ allowed: false } as any));
    setAllowed(!!can);
    // Usuario autenticado (RLS): cada uno ve solo lo suyo
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;

    // Preferir el último plan creado (persistido en localStorage)
    let planRow: any | null = null;
    try {
      const lastId = localStorage.getItem('vita-last-plan-id');
      if (lastId) {
        const { data } = await supabase.from('planes').select('*').eq('id', lastId).single();
        // Verificamos que pertenezca al usuario actual
        if (data && (!uid || data.user_id === uid)) {
          planRow = data;
        }
      }
    } catch {}
    // Si no hay local o no coincide, usar el más reciente del usuario
    if (!planRow) {
      const { data } = await supabase
        .from('planes')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      planRow = data ?? null;
    }
    if (!planRow) { setPlan(null); setDias([]); setLoading(false); return; }
    setPlan(planRow);

    const { data: rutinas } = await supabase
      .from('rutinas')
      .select('id,dia_semana,foco,minutos')
      .eq('plan_id', planRow.id)
      .eq('semana', 1)
      // Nota: filtramos por plan_id/semana; user_id puede faltar en algunos inserts
      .order('dia_semana', { ascending: true });

    const ids = (rutinas ?? []).map((r:any)=>r.id);
    const { data: detalle } = await supabase
      .from('rutina_ejercicios')
      .select('rutina_id,ejercicio_id,series,reps,tiempo_seg,descanso_seg')
      .in('rutina_id', ids.length ? ids : ['__none__']);

    const exIds = Array.from(new Set((detalle ?? []).map((d: { ejercicio_id: string }) => d.ejercicio_id)));
    let nombres = new Map<string,string>();
    if (exIds.length) {
      const { data: ex } = await supabase
        .from('ejercicios').select('id,nombre').in('id', exIds);
      nombres = new Map((ex ?? []).map((e: { id: string; nombre: string }) => [e.id, e.nombre]));
    }

    const out: RutinaDia[] = (rutinas ?? []).map((r:any) => ({
      ...r,
      items: (detalle ?? [])
        .filter((d: { rutina_id: string }) => d.rutina_id === r.id)
        .map((d: { ejercicio_id: string; nombre?: string }) => ({ ...d, nombre: nombres.get(d.ejercicio_id) ?? d.ejercicio_id }))
    }));
    setDias(out);
    // Marcas locales: evitar duplicar "hecho" el mismo día
    try {
      const dateKey = dateKeyMX(new Date());
      const map: Record<string, boolean> = {};
      out.forEach(d => {
        const k = `vc.rutina.done.${d.id}.${dateKey}`;
        map[d.id] = !!localStorage.getItem(k);
      });
      setDoneToday(map);
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  // Marca una rutina como hecha hoy: inserta un workout para alimentar Progreso
  const marcarHecha = async (d: RutinaDia) => {
    try {
      const dateKey = dateKeyMX(new Date());
      const localKey = `vc.rutina.done.${d.id}.${dateKey}`;
      if (doneToday[d.id]) return; // ya marcada

      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) {
        alert('Necesitas iniciar sesión para registrar tu progreso.');
        return;
      }
      // Simula inicio-fin usando la duración planificada
      const tsFin = new Date();
      const tsInicio = new Date(tsFin.getTime() - Math.max(0, (d.minutos || 0)) * 60 * 1000);
      // Estimación simple de kcal (5 kcal/min como base segura)
      const kcal = Math.max(0, Math.round((d.minutos || 0) * 5));
      const minutos = Math.max(0, d.minutos || 0);

      const { error } = await supabase.from('workouts').insert({
        user_id: uid,
        ts_inicio: tsInicio.toISOString(),
        ts_fin: tsFin.toISOString(),
        minutos,
        kcal,
      } as any);
      if (error) throw error;
      // Guardar marca local para evitar duplicados del mismo día
      try { localStorage.setItem(localKey, '1'); } catch {}
      setDoneToday(prev => ({ ...prev, [d.id]: true }));
      // Feedback simple
      alert(`¡Bien! Registramos tu sesión del Día ${d.dia_semana}. Esto suma a tu Progreso.`);
    } catch (e:any) {
      console.error(e);
      alert('No pudimos guardar tu progreso. Inténtalo de nuevo.');
    }
  };

  // Function to mark a routine as completed and persist it in Supabase
  const markRoutineAsCompleted = async (userId: string, rutinaId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('rutinas_completadas')
        .insert({
          user_id: userId,
          rutina_id: rutinaId,
          fecha_completada: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving completed routine to Supabase:', error);
      } else {
        console.log('Routine marked as completed in Supabase:', rutinaId);
      }
    } catch (err) {
      console.error('Unexpected error marking routine as completed:', err);
    }
  };

  // Function to synchronize completed routines from Supabase
  const syncCompletedRoutines = async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('rutinas_completadas')
        .select('rutina_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching completed routines from Supabase:', error);
        return [];
      }

      return data.map((entry: { rutina_id: string }) => entry.rutina_id);
    } catch (err) {
      console.error('Unexpected error fetching completed routines:', err);
      return [];
    }
  };

  // Example usage: Mark a routine as completed and sync state
  const handleRoutineCompletion = async (userId: string, rutinaId: string): Promise<void> => {
    await markRoutineAsCompleted(userId, rutinaId);
    const completedRoutines = await syncCompletedRoutines(userId);
    console.log('Synchronized completed routines:', completedRoutines);
  };

  if (loading) return <Layout title="Mi Plan" showBackButton><div className="p-4">Cargando…</div></Layout>;
  if (!plan)   return <Layout title="Mi Plan" showBackButton><div className="p-4">Aún no hay plan creado para tu usuario.</div></Layout>;

  return (
    <Layout title="Mi Plan" showBackButton>
      <div className="p-4 space-y-4">
        {!allowed && (
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-100 px-3 py-2 text-sm">
            Tu acceso no está activo. Puedes ver tu plan, pero para registrar progreso y recordatorios, activa tu membresía en Pago.
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-cyan-200 drop-shadow-[0_2px_8px_rgba(0,255,255,0.18)]">Mi rutina — Semana 1</h1>
          <button onClick={load} className="px-3 py-1 rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100/90 hover:bg-cyan-400/20 hover:shadow-[0_0_16px_2px_rgba(0,255,255,0.12)] text-sm">Refrescar</button>
        </div>
        {plan && (
          <NeonCard className="p-3" hoverable>
            <div className="text-sm opacity-90">
              <span className="mr-4"><span className="opacity-70">Objetivo:</span> <strong>{plan.objetivo}</strong></span>
              <span className="mr-4"><span className="opacity-70">Semanas:</span> <strong>{plan.semanas}</strong></span>
              <span className="mr-4"><span className="opacity-70">Días/semana:</span> <strong>{plan.dias_semana}</strong></span>
              <span><span className="opacity-70">Min/sesión:</span> <strong>{plan.minutos_sesion}′</strong></span>
            </div>
          </NeonCard>
        )}
        {(() => {
          const visibles = hideDoneToday ? dias.filter(d => !doneToday[d.id]) : dias;
          const totalEj = visibles.reduce((acc,d)=>acc + (d.items?.length ?? 0), 0);
          return (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">
                  <span className="mr-4">Rutinas: {visibles.length}{hideDoneToday && visibles.length !== dias.length ? ` / ${dias.length}` : ''}</span>
                  <span>Ejercicios totales: {totalEj}</span>
                </div>
                <label className="flex items-center gap-2 text-xs opacity-80">
                  <input type="checkbox" checked={hideDoneToday} onChange={e=>setHideDoneToday(e.target.checked)} />
                  Ocultar hechos hoy
                </label>
              </div>
              {visibles.length === 0 && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-100 px-3 py-2 text-sm">
                  ¡Listo por hoy! Ya marcaste todas tus rutinas. Vuelve mañana para continuar.
                </div>
              )}
              {visibles.map(d => (
                <NeonCard key={d.id} className="p-4" hoverable>
                  <div className="font-semibold text-white flex items-center justify-between">
                    <div>
                      <span className="text-[color:var(--vc-primary,#f06340)] drop-shadow-[0_0_8px_rgba(240,99,64,0.6)]">Día {d.dia_semana}</span> — {d.foco} · {d.minutos}′
                    </div>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs border border-cyan-300/30 bg-cyan-400/10 text-cyan-100/90" style={{ animation: 'neonPulseSoft 2.4s ease-in-out infinite' }}>Neón</span>
                  </div>
                  {d.items?.length ? (
                    <ul className="list-disc pl-6 text-sm opacity-90 mt-2">
                      {d.items.map((it, i) => (
                        <li key={i}>
                          {it.nombre}: {it.series}×{it.reps ?? `${it.tiempo_seg}s`} · descanso {it.descanso_seg ?? 60}s
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-sm opacity-70">Sin ejercicios</div>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs opacity-70">Marca el día como hecho para sumar a tu progreso y constancia.</div>
                    <button
                      onClick={() => marcarHecha(d)}
                      disabled={!!doneToday[d.id]}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors ${doneToday[d.id] ? 'opacity-60 cursor-default border-white/10 bg-white/5' : 'border-cyan-300/20 bg-cyan-400/10 hover:bg-cyan-400/20 hover:shadow-[0_0_16px_2px_rgba(0,255,255,0.12)]'}`}
                      style={{ boxShadow: doneToday[d.id] ? undefined : '0 0 0 1px rgba(0,255,231,0.28)', animation: doneToday[d.id] ? undefined : 'neonPulseSoft 2.2s ease-in-out infinite' }}
                      aria-label={doneToday[d.id] ? 'Ya marcado' : 'Marcar como hecho'}
                    >
                      {doneToday[d.id] ? 'Hecho hoy' : 'Marcar como hecho'}
                    </button>
                  </div>
                </NeonCard>
              ))}
            </>
          );
        })()}
      </div>
    </Layout>
  );
}
