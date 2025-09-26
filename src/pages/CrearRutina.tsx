// src/pages/CrearRutina.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { VITA } from '../lib/categories';
import GoalTest from '../components/rutina/GoalTest';
import EjercicioCard from '../components/rutina/EjercicioCard';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);
import { useToast } from '../components/ui/use-toast';
import Chip from '../components/ui/Chip';
import Progress from '../components/ui/Progress';

export type Categoria = 'empuje'|'tiron'|'rodilla'|'cadera'|'core'|'movilidad'|'cardio';

export type RutinaDetalle = {
  rutina_id: string;
  user_id: string;
  semana: number;
  dia_semana: number;
  foco: string;
  minutos: number;
  rutina_ejercicio_id: string;
  slug: string;
  nombre: string;
  categoria: Categoria;
  equipo: string[];
  cues: string[];
  contraindicaciones: string[];
  imagen_url: string|null;
  series: number;
  reps: number|null;
  tiempo_seg: number|null;
  descanso_seg: number;
  rpe: number;
};

function mapDiaSemana(d: number) {
  // JS: 0=Domingo ... 6=Sabado; BD: 1..7 (1=Lunes o 1=Domingo según diseño)
  // Si BD espera 1..7 con 7=Domingo:
  return d === 0 ? 7 : d;
}

export default function CrearRutina() {
  const { user, loading: authLoading } = useAuth();
  const [objetivo, setObjetivo] = useState<string>('');
  const [rutina, setRutina] = useState<RutinaDetalle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [planMinutos, setPlanMinutos] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [rutinaEstado, setRutinaEstado] = useState<string | null>(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  // toasts globales con useToast
  const [liveMsg, setLiveMsg] = useState<string>("");
  const regenBtnRef = useRef<HTMLButtonElement | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debug, setDebug] = useState<{action?: string; payload?: any; status?: number; createdCount?: number; durationMs?: number}>({});
  const { toast } = useToast();
  const metrics = { track: (name: string, data: any) => { try { console.log('metrics', name, data); } catch {} } };
  const lastActionRef = useRef<'generate-plan' | 'regenerate-day' | 'complete-routine' | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const completeBtnRef = useRef<HTMLButtonElement | null>(null);

  const semanaActual = 1; // simple por ahora; se puede derivar de created_at
  const diaHoy = dayjs().isoWeekday(); // 1..7

  async function fetchWithRetry(url: string, init: RequestInit, { timeoutMs = 10000, retries = 1 } = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...init, signal: controller.signal });
      if (resp.status >= 500 && resp.status <= 599 && retries > 0) {
        await new Promise(r => setTimeout(r, 500));
        return fetchWithRetry(url, init, { timeoutMs, retries: retries - 1 });
      }
      return resp;
    } finally {
      clearTimeout(id);
    }
  }

  const userId = user?.id as string | undefined;

  async function refetch(): Promise<number> {
    if (!userId) { setLoading(false); return 0; }
    setLoading(true);

    // 1) plan activo
    const { data: plan, error: e1 } = await supabase
      .from('planes')
      .select('id, objetivo, created_at, dias_semana, minutos_sesion')
      .eq('user_id', userId)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (e1 && e1.code !== 'PGRST116') {
      console.error(e1);
    }

    if (!plan) {
      setObjetivo('');
      setPlanMinutos(null);
      setRutina(null);
      setLoading(false);
  return 0;
    }

    setObjetivo(plan.objetivo);
    setPlanMinutos(plan.minutos_sesion ?? null);

    // 2) rutina del día
    const { data: det, error: e2 } = await supabase
      .from('v_rutina_detalle')
      .select('*')
      .eq('user_id', userId)
      .eq('semana', semanaActual)
      .eq('dia_semana', diaHoy)
      .order('rutina_ejercicio_id', { ascending: true });

    if (e2) {
      console.error(e2);
    }
    const list = det ?? [];
    setRutina(list);

    // 3) estado de la rutina (tabla base)
    try {
      const { data: base, error: e3 } = await supabase
        .from('rutinas')
        .select('estado')
        .eq('user_id', userId)
        .eq('semana', semanaActual)
        .eq('dia', diaHoy)
        .limit(1)
        .single();
      if (e3 && e3.code !== 'PGRST116') {
        console.warn('estado rutina error:', e3);
      }
      setRutinaEstado(base?.estado ?? null);
    } catch (e) {
      console.warn('estado rutina catch:', e);
      setRutinaEstado(null);
    }
    setLoading(false);
    return list.length;
  }

  useEffect(() => {
    if (!userId) return; // Espera a AuthContext
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const hayPlan = useMemo(() => objetivo && objetivo.length > 0, [objetivo]);

  async function handleGenerate(payload: any) {
    lastActionRef.current = 'generate-plan';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`;
    const body = { userId: session.user.id, ...payload };
    const t0 = performance.now();
    const resp = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, { timeoutMs: 10000, retries: 1 });
    const ms = Math.round(performance.now() - t0);
    let out: any = null; try { out = await resp.json(); } catch {}
    if (resp.status >= 400) {
      setDebug({ action: 'generate-plan', payload: body, status: resp.status, createdCount: out?.createdCount, durationMs: ms });
      const isConflict = resp.status === 409 || out?.code === 'CONFLICT';
      toast({
        title: isConflict ? 'Ya existe rutina para hoy' : `Error ${resp.status}${out?.requestId ? ` • ${out.requestId}` : ''}`,
        description: `${out?.code ?? (resp.status>=500?'INTERNAL':'ERROR')}: ${out?.message ?? (resp.status>=500?'Temporalmente no disponible':'Error al procesar tu solicitud')} • ${ms} ms`,
        variant: isConflict ? 'warning' : 'destructive',
        action: (
          <div className="flex gap-2">
            <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => {
              listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              const el = listRef.current?.querySelector('[role="listitem"]') as HTMLElement | null;
              setTimeout(() => el?.focus?.(), 300);
              metrics.track('fit_conflict_handled', { actionFrom: 'generate-plan', chosenCTA: 'view', routine_id: out?.routine_id, N: rutina?.length ?? 0 });
            }}>Ver rutina</button>
            {isConflict ? (
              <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => handleRegenerarDia()}>Regenerar día</button>
            ) : (
              <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => setDebugOpen(true)}>Ver Debug</button>
            )}
          </div>
        ),
        role: 'status', 'aria-live': 'assertive', duration: 5000,
      } as any);
      metrics.track('fit_generate_plan', { ok: false, status: resp.status, ms, code: out?.code, requestId: out?.requestId });
      return;
    }
    const t1 = performance.now();
    setDebug({ action: 'generate-plan', payload: body, status: resp.status, createdCount: out?.createdCount, durationMs: Math.round(t1 - t0) });
    const N = await refetch();
    metrics.track('fit_generate_plan', { ok: true, status: resp.status, ms: Math.round(t1 - t0), createdCount: out?.createdCount, N });
    if (out?.ok && (!N || N === 0)) {
      toast({
        title: 'Sin ejercicios generados',
        description: `N=${N}. Revisa la función o la vista v_rutina_detalle${out?.requestId ? ` • id: ${out.requestId}` : ''}`,
        variant: 'warning', duration: 8000,
        action: { label: 'Ver logs', onClick: () => setDebugOpen(true) },
      } as any);
    } else {
      toast({ title: 'Operación exitosa', description: `Tiempo: ${Math.round(t1 - t0)} ms • creados: ${out?.createdCount ?? '—'} • ejercicios hoy: ${N}`, duration: 4500 } as any);
    }
  }

  async function handleRegenerarDia() {
    lastActionRef.current = 'regenerate-day';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !userId) return;
    try {
      setRegenerating(true);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-day`;
      const body = {
        userId: userId,
        semana: semanaActual,
        dia: diaHoy,
        minutos: planMinutos ?? 25,
      };
      const t0 = performance.now();
      const r = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, { timeoutMs: 10000, retries: 1 });
      let out: any = null; try { out = await r.json(); } catch {}
      const ms = Math.round(performance.now() - t0);
      if (r.status >= 400 || !out?.ok) {
        setDebug({ action: 'regenerate-day', payload: body, status: r.status, createdCount: out?.createdCount, durationMs: ms });
        const isConflict = r.status === 409 || out?.code === 'CONFLICT';
        toast({
          title: isConflict ? 'Ya existe rutina para hoy' : `Error ${r.status}${out?.requestId ? ` • ${out.requestId}` : ''}`,
          description: `${out?.code ?? (r.status>=500?'INTERNAL':'ERROR')}: ${out?.message ?? (r.status>=500?'Temporalmente no disponible':'Error al procesar tu solicitud')} • ${ms} ms`,
          variant: isConflict ? 'warning' : 'destructive',
          action: (
            <div className="flex gap-2">
              <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => {
                listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const el = listRef.current?.querySelector('[role="listitem"]') as HTMLElement | null;
                setTimeout(() => el?.focus?.(), 300);
                metrics.track('fit_conflict_handled', { actionFrom: 'regenerate-day', chosenCTA: 'view', routine_id: out?.routine_id, N: rutina?.length ?? 0 });
              }}>Ver rutina</button>
              {r.status >= 500 ? (
                <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => handleRegenerarDia()}>Reintentar</button>
              ) : isConflict ? (
                <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => handleRegenerarDia()}>Regenerar día</button>
              ) : (
                <button className="rounded-md px-3 py-1 bg-white/10 border border-white/10" onClick={() => setDebugOpen(true)}>Ver Debug</button>
              )}
            </div>
          ),
          role: 'status', 'aria-live': 'assertive', duration: 5000,
        } as any);
        metrics.track('fit_regenerate_day', { ok: false, status: r.status, ms, code: out?.code, requestId: out?.requestId });
        return;
      }
      const t1 = performance.now();
      setDebug({ action: 'regenerate-day', payload: body, status: r.status, createdCount: out?.createdCount, durationMs: Math.round(t1 - t0) });
      const N = await refetch();
      metrics.track('fit_regenerate_day', { ok: true, status: r.status, ms: Math.round(t1 - t0), createdCount: out?.createdCount, N });
      if (out?.ok && (!N || N === 0)) {
        toast({
          title: 'Sin ejercicios generados',
          description: `N=${N}. Revisa la función o la vista v_rutina_detalle${out?.requestId ? ` • id: ${out.requestId}` : ''}`,
          variant: 'warning', duration: 8000,
          action: { label: 'Debug', onClick: () => setDebugOpen(true) },
        } as any);
      } else {
        toast({ title: 'Operación exitosa', description: `Tiempo: ${Math.round(t1 - t0)} ms • creados: ${out?.createdCount ?? '—'} • ejercicios hoy: ${N}`, duration: 4500 } as any);
      }
      setLiveMsg('Rutina actualizada');
      setTimeout(() => regenBtnRef.current?.focus(), 0);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo regenerar el día', variant: 'destructive', duration: 5000 } as any);
    } finally {
      setRegenerating(false);
    }
  }

  function handleStartRoutine() {
    const N = rutina?.length ?? 0;
    metrics.track('fit_start_routine', { N });
    if (N === 0) {
      toast({ title: 'No hay ejercicios aún', description: 'Regenero tu sesión de hoy automáticamente.', duration: 3000 } as any);
      handleRegenerarDia();
      return;
    }
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const el = listRef.current?.querySelector('[role="listitem"]') as HTMLElement | null;
    setTimeout(() => el?.focus?.(), 300);
  }

  async function handleCompleteRoutine() {
    lastActionRef.current = 'complete-routine';
    setIsCompleting(true);
    const t0 = performance.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token || !userId) throw new Error('NO_SESSION');

      // Actualiza directamente en Supabase (RLS por user_id)
      const { data, error, status } = await supabase
        .from('rutinas')
        .update({ estado: 'completada', completada_en: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('semana', semanaActual)
        .eq('dia', diaHoy)
        .neq('estado', 'completada')
        .select('id');

      const ms = Math.round(performance.now() - t0);
      const updatedCount = Array.isArray(data) ? data.length : 0;

      if (error) {
        setDebug({ action: 'complete-routine', payload: { semana: semanaActual, dia: diaHoy }, status, createdCount: updatedCount, durationMs: ms });
        toast({
          title: `Error ${status ?? 400}`,
          description: `${error.code ?? 'ERROR'}: ${error.message ?? 'No se pudo completar la rutina'} • ${ms} ms`,
          variant: 'destructive',
          action: { label: 'Ver Debug', onClick: () => setDebugOpen(true) },
          duration: 6000,
        } as any);
        metrics.track('fit_complete_routine', { ok: false, status: status ?? 400, ms, updatedCount, code: error.code });
        return;
      }

      metrics.track('fit_complete_routine', { ok: true, status: 200, ms, updatedCount });
      await refetch();

      if (updatedCount > 0) {
        setLiveMsg('Rutina marcada como completada');
        toast({ title: 'Rutina completada', description: `Tiempo ${ms} ms • actualizadas ${updatedCount}` } as any);
        // Mantener foco en el botón
        setTimeout(() => completeBtnRef.current?.focus(), 0);
      } else {
        toast({ title: 'Nada para completar', description: 'No se actualizó ninguna rutina', variant: 'warning', duration: 8000 } as any);
      }
    } catch (e: any) {
      const ms = Math.round(performance.now() - t0);
      console.error(e);
      setDebug({ action: 'complete-routine', payload: { semana: semanaActual, dia: diaHoy }, status: 500, createdCount: 0, durationMs: ms });
      toast({ title: 'Error', description: e?.message ?? 'No se pudo completar la rutina', variant: 'destructive', duration: 6000 } as any);
      metrics.track('fit_complete_routine', { ok: false, status: 500, ms, updatedCount: 0, code: e?.message });
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${VITA.bg} text-[#E6EAF2]`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* HERO */}
        <header className="rounded-2xl p-5 bg-white/5 backdrop-blur border border-white/10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Bienvenida a tu rutina</h1>
          <p className="text-white/70">{hayPlan ? 'Aquí pulimos tu mejor versión.' : 'Aquí construimos tu plan. Juntas llegamos a tu objetivo.'}</p>
          <div className="flex gap-2 flex-wrap">
            <Chip>Objetivo: {hayPlan ? objetivo.toUpperCase() : '—'}</Chip>
            <Chip>Semana {semanaActual}/4</Chip>
            <Chip>Día {diaHoy}</Chip>
            <Chip>{planMinutos ?? 25} min</Chip>
          </div>
          <Progress value={(semanaActual/4)*100} />
          {hayPlan && (
            <div className="mt-3">
              <button
                role="button"
                className="rounded-xl px-4 py-2 font-semibold text-white/90 bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
                onClick={() => setShowPlanEditor(true)}
              >Ajustar objetivo</button>
            </div>
          )}
        </header>

        {(authLoading || loading) && (
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6">
            Cargando…
          </div>
        )}

        {!authLoading && !loading && !hayPlan && (
          <section className="mt-6 space-y-3">
            <div className="rounded-2xl p-5 md:p-6 bg-white/5 border border-white/10">
              <h2 className="text-xl font-semibold">Primero, definamos tu meta</h2>
              <p className="mt-1 text-[#E6EAF2]/70">Son 30 segundos y tendremos tu plan listo.</p>
            </div>
            <GoalTest onSubmit={handleGenerate} />
          </section>
        )}

        {!authLoading && !loading && hayPlan && (
          <section className="mt-6 space-y-4">
            {/* Bloque resumen y acciones */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Rutina de hoy</h2>
                  <p className="mt-1 text-white/70">Ejercicios hoy: {rutina?.length ?? 0} • Estimado {planMinutos ?? 25} min</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    role="button"
                    className="rounded-xl px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
                    style={{ backgroundColor: '#FF5A2A' }}
                    onClick={handleStartRoutine}
                    aria-label="Iniciar rutina"
                  >
                    Iniciar rutina
                  </button>
                  <button
                    role="button"
                    aria-disabled={regenerating}
                    disabled={regenerating}
                    ref={regenBtnRef}
                    className="rounded-xl px-4 py-2 font-semibold text-white/90 bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleRegenerarDia}
                  >
                    {regenerating ? 'Regenerando…' : 'Regenerar día'}
                  </button>
                  {rutinaEstado !== 'completada' ? (
                    <button
                      role="button"
                      aria-label="Marcar rutina como completada"
                      aria-disabled={isCompleting || (rutina?.length ?? 0) === 0}
                      disabled={isCompleting || (rutina?.length ?? 0) === 0}
                      ref={completeBtnRef}
                      className="rounded-xl px-4 py-2 font-semibold text-white/90 bg-white/5 border border-white/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A] disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={handleCompleteRoutine}
                    >
                      {isCompleting ? 'Marcando…' : 'Marcar como completada'}
                    </button>
                  ) : (
                    <div className="text-sm px-3 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30 self-start">Rutina completada hoy</div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista o estado vacío */}
            {rutina && rutina.length > 0 ? (
              <div className="grid gap-4" role="list" aria-label="Lista de ejercicios" ref={listRef}>
                {rutina.map(item => (
                  <EjercicioCard
                    key={item.rutina_ejercicio_id}
                    nombre={item.nombre}
                    categoria={item.categoria}
                    series={item.series}
                    reps={item.reps}
                    tiempo_seg={item.tiempo_seg}
                    descanso_seg={item.descanso_seg}
                    cues={item.cues || []}
                    equipo={item.equipo || []}
                    contraindicaciones={item.contraindicaciones || []}
                    imagen_url={item.imagen_url}
                    completed={rutinaEstado === 'completada'}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-5 md:p-6 bg-white/5 border border-white/10 shadow-lg">
                <p className="text-white/80">Hoy no hay ejercicios asignados. Regenera la sesión y te pongo algo a tu medida.</p>
                <button
                  role="button"
                  aria-disabled={regenerating}
                  disabled={regenerating}
                  className="mt-3 rounded-xl px-5 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FF5A2A' }}
                  onClick={handleRegenerarDia}
                >
                  {regenerating ? 'Regenerando…' : 'Regenerar día'}
                </button>
              </div>
            )}

            {/* Panel de ayuda colapsable (reutiliza Debug panel toggle para no saturar UI) */}
            <div className="flex justify-end">
              <button
                role="button"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
                onClick={() => setDebugOpen(v => !v)}
              >{debugOpen ? 'Ocultar ayuda' : 'Cómo usar tu rutina'}</button>
            </div>
            {debugOpen && (
              <div className="mt-2 p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-[#E6EAF2]/85 text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Inicia tu rutina para ver los ejercicios del día con detalles.</li>
                  <li>Si no te convence, toca “Regenerar día” y te propongo otra sesión.</li>
                  <li>Al terminar, marca como completada. ¡Orgullo desbloqueado!</li>
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Overlay de edición de plan (GoalTest) */}
        {showPlanEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPlanEditor(false)} />
            <div className="relative w-full max-w-2xl">
              <div className="flex justify-end mb-2">
                <button
                  role="button"
                  className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
                  onClick={() => setShowPlanEditor(false)}
                >Cerrar</button>
              </div>
              <GoalTest onSubmit={async (payload) => {
                await handleGenerate(payload);
                setShowPlanEditor(false);
              }} />
            </div>
          </div>
        )}
      </div>
      <div className="sr-only" aria-live="polite">{liveMsg}</div>

      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <button
            role="button"
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A2A] focus:ring-offset-[#0B1F3A]"
            onClick={() => setDebugOpen(v => !v)}
          >{debugOpen ? 'Ocultar' : 'Debug'}</button>
          {debugOpen && (
            <div className="mt-2 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md text-[#E6EAF2] text-xs">
              <div><strong>action:</strong> {debug.action || '-'}</div>
              <div><strong>status:</strong> {typeof debug.status === 'number' ? debug.status : '-'}</div>
              <div><strong>createdCount:</strong> {typeof debug.createdCount === 'number' ? debug.createdCount : '-'}</div>
              <div><strong>duration:</strong> {typeof debug.durationMs === 'number' ? `${debug.durationMs}ms` : '-'}</div>
              <div className="mt-1 break-words"><strong>payload:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(debug.payload, null, 2)}</pre></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
