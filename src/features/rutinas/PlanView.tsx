import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAccess } from '@/lib/access';

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

export default function PlanView() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any|null>(null);
  const [dias, setDias] = useState<RutinaDia[]>([]);

  const load = async () => {
    setLoading(true);
    // Guard de acceso
    const { allowed } = await ensureAccess();
    if (!allowed) {
      setLoading(false);
      alert('Tu acceso no está activo. Ve a la pasarela para activarlo.');
      return;
    }
    // Usuario autenticado (RLS): cada uno ve solo lo suyo
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;

    // Último plan del usuario
    const { data: planRow } = await supabase
      .from('planes')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!planRow) { setPlan(null); setDias([]); setLoading(false); return; }
    setPlan(planRow);

    const { data: rutinas } = await supabase
      .from('rutinas')
      .select('id,dia_semana,foco,minutos')
      .eq('plan_id', planRow.id)
      .eq('semana', 1)
      .eq('user_id', uid)
      .order('dia_semana', { ascending: true });

    const ids = (rutinas ?? []).map((r:any)=>r.id);
    const { data: detalle } = await supabase
      .from('rutina_ejercicios')
      .select('rutina_id,ejercicio_id,series,reps,tiempo_seg,descanso_seg')
      .in('rutina_id', ids.length ? ids : ['__none__']);

    const exIds = Array.from(new Set((detalle??[]).map(d=>d.ejercicio_id)));
    let nombres = new Map<string,string>();
    if (exIds.length) {
      const { data: ex } = await supabase
        .from('ejercicios').select('id,nombre').in('id', exIds);
      nombres = new Map((ex ?? []).map(e => [e.id, e.nombre]));
    }

    const out: RutinaDia[] = (rutinas ?? []).map((r:any) => ({
      ...r,
      items: (detalle ?? [])
        .filter(d => d.rutina_id === r.id)
        .map(d => ({ ...d, nombre: nombres.get(d.ejercicio_id) ?? d.ejercicio_id }))
    }));
    setDias(out);
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (!plan)   return <div className="p-4">Aún no hay plan creado para tu usuario.</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mi rutina — Semana 1</h1>
        <button onClick={load} className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">Refrescar</button>
      </div>
      {plan && (
        <div className="text-sm opacity-90 bg-white/5 border border-white/10 rounded-xl p-3">
          <span className="mr-4"><span className="opacity-70">Objetivo:</span> <strong>{plan.objetivo}</strong></span>
          <span className="mr-4"><span className="opacity-70">Semanas:</span> <strong>{plan.semanas}</strong></span>
          <span className="mr-4"><span className="opacity-70">Días/semana:</span> <strong>{plan.dias_semana}</strong></span>
          <span><span className="opacity-70">Min/sesión:</span> <strong>{plan.minutos_sesion}′</strong></span>
        </div>
      )}
      <div className="text-sm opacity-80">
        <span className="mr-4">Rutinas: {dias.length}</span>
        <span>Ejercicios totales: {dias.reduce((acc,d)=>acc + (d.items?.length ?? 0), 0)}</span>
      </div>
      {dias.map(d => (
        <div key={d.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="font-semibold">Día {d.dia_semana} — {d.foco} · {d.minutos}′</div>
          {d.items?.length ? (
            <ul className="list-disc pl-6 text-sm opacity-90">
              {d.items.map((it, i) => (
                <li key={i}>
                  {it.nombre}: {it.series}×{it.reps ?? `${it.tiempo_seg}s`} · descanso {it.descanso_seg ?? 60}s
                </li>
              ))}
            </ul>
          ) : <div className="text-sm opacity-70">Sin ejercicios</div>}
        </div>
      ))}
    </div>
  );
}
