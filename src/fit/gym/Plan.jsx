import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { createAgendaEvent } from '@/lib/agenda';

const NeonCard = ({ className = '', hoverable = false, children }) => (
  <div
    className={`group relative rounded-2xl border bg-white/5 border-violet-300/20 p-4 shadow-[0_20px_40px_rgba(60,0,120,0.35)] ${hoverable ? 'transition-all duration-300 hover:bg-violet-400/10 hover:shadow-[0_0_32px_4px_rgba(180,80,255,0.18)]' : ''} ${className}`}
    style={{ boxShadow: '0 0 0 1.5px #b388ff, 0 20px 40px rgba(60,0,120,0.35)' }}
  >
    <style>{`@keyframes neonPulseSoft {0%,100%{box-shadow:0 0 0 1px rgba(179,136,255,0.28),0 0 18px rgba(179,136,255,0.12)}50%{box-shadow:0 0 0 1px rgba(179,136,255,0.55),0 0 24px rgba(179,136,255,0.25)}}`}</style>
    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-violet-300/30" />
    <div className="relative z-10">{children}</div>
  </div>
);

export default function GymPlan() {
  const [loading, setLoading] = useState(true);
  const [circuit, setCircuit] = useState(null);
  const [items, setItems] = useState([]);
  const [names, setNames] = useState({});
  const [doneToday, setDoneToday] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState([1,3,5]); // 1=Dom..7=Sáb según agenda.ts weekly

  const load = async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) { setLoading(false); return; }

      // Último circuito propio actualizado
      const { data: cs } = await supabase
        .from('gym_circuits')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(1);
      let c = cs?.[0] || null;
      // Fallback: si no hay circuito en DB, usar borrador local
      if (!c) {
        try {
          const draft = JSON.parse(localStorage.getItem('vc.gym.circuit.draft') || 'null');
          if (draft && (draft.items||[]).length) {
            c = { id: 'local-draft', name: draft.name || 'Mi circuito (borrador)' };
            setCircuit(c);
            setItems((draft.items||[]).map((it, idx) => ({
              ejercicio_id: it.id,
              orden: idx+1,
              series: it.series ?? 3,
              reps: it.reps ?? null,
              tiempo_seg: null,
              descanso_seg: it.descanso ?? 60,
            })));
            setNames(Object.fromEntries((draft.items||[]).map(it=>[it.id, it.nombre || it.id])));
            setLoading(false);
            return;
          }
        } catch {}
      }
      setCircuit(c);
      if (!c) { setItems([]); setLoading(false); return; }

      const { data: its } = await supabase
        .from('gym_circuit_items')
        .select('ejercicio_id,orden,series,reps,tiempo_seg,descanso_seg')
        .eq('circuit_id', c.id)
        .order('orden', { ascending: true });
      setItems(its || []);

      const ids = Array.from(new Set((its || []).map((i) => i.ejercicio_id)));
      if (ids.length) {
        const { data: ex } = await supabase.from('ejercicios').select('id,nombre').in('id', ids);
        const map = Object.fromEntries((ex || []).map((e) => [e.id, e.nombre]));
        setNames(map);
      } else {
        setNames({});
      }

      // Marca local de hecho hoy (por circuito id)
      const key = `vc.gym.plan.done.${c.id}.${new Date().toDateString()}`;
      setDoneToday(!!localStorage.getItem(key));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  function nextDateForWeekday(wd){
    // wd: 1=Dom..7=Sáb
    const now = new Date();
    const todayWD = now.getDay()+1; // 0=Dom
    let add = wd - todayWD;
    if (add <= 0) add += 7; // próxima ocurrencia
    const d = new Date(now);
    d.setDate(now.getDate()+add);
    return d;
  }

  const programarRecordatorios = async () => {
    if (!circuit) return;
    try {
      const [hh,mm] = time.split(':').map(x=>Number(x));
      for (const wd of days) {
        const d = nextDateForWeekday(wd);
        const yyyy = d.getFullYear();
        const mm2 = String(d.getMonth()+1).padStart(2,'0');
        const dd2 = String(d.getDate()).padStart(2,'0');
        await createAgendaEvent({
          type: 'otro',
          title: `Entrenamiento (Gym): ${circuit.name}`,
          description: 'Sesión programada de tu circuito',
          event_date: `${yyyy}-${mm2}-${dd2}`,
          event_time: `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`,
          notify: true,
          repeat_type: 'weekly',
          repeat_until: null,
        });
      }
      // Guardar parámetros de plan para Progreso (Gym): días/semana y minutos por sesión
      try {
        const totalSeg = (items || []).reduce((acc, it) => {
          const reps = Number(it.reps) || 0;
          const series = Number(it.series) || 1;
          const descanso = Number(it.descanso_seg) || 60;
          const trabajo = reps * 3; // 3s por rep
          return acc + series * (trabajo + descanso);
        }, 0);
        const minutos = Math.max(15, Math.round(totalSeg / 60));
        localStorage.setItem('vc.gym.params', JSON.stringify({ diasSemana: days.length, minutos }));
      } catch {}
      alert('Recordatorios creados en Agenda.');
      setShowReminders(false);
    } catch (e) {
      console.error(e);
      alert('No se pudieron crear los recordatorios.');
    }
  };

  const marcarHecha = async () => {
    if (!circuit) return;
    try {
      // Estimación de minutos: series * (reps*3s + descanso)
      const totalSeg = (items || []).reduce((acc, it) => {
        const reps = Number(it.reps) || 0;
        const series = Number(it.series) || 1;
        const descanso = Number(it.descanso_seg) || 60;
        const trabajo = reps * 3; // 3s por rep, aprox
        return acc + series * (trabajo + descanso);
      }, 0);
      const minutos = Math.max(5, Math.round(totalSeg / 60));
      const kcal = Math.max(0, Math.round(minutos * 5));

      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) { alert('Inicia sesión.'); return; }

      // Guardar sesión de Gym (si el circuito es válido en DB)
      const isUUID = typeof circuit.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(circuit.id);
      if (isUUID) {
        const { error: e1 } = await supabase.from('gym_sessions').insert({
          user_id: uid,
          circuit_id: circuit.id,
          minutos,
          kcal,
          started_at: new Date().toISOString(),
        });
        if (e1) throw e1;
      } else {
        // Sin circuito en DB (borrador local): registramos solo en workouts para KPIs globales
        console.warn('Circuito local (sin UUID); se omite gym_sessions');
      }

      // Añadir a workouts para KPIs globales (sin .catch encadenado)
      try {
        await supabase.from('workouts').insert({
          user_id: uid,
          ts_inicio: new Date(Date.now() - minutos * 60000).toISOString(),
          ts_fin: new Date().toISOString(),
          minutos,
          kcal,
        });
      } catch (e) {
        console.warn('No se pudo insertar en workouts:', e?.message || e);
      }

      try {
        const key = `vc.gym.plan.done.${circuit.id}.${new Date().toDateString()}`;
        localStorage.setItem(key, '1');
        setDoneToday(true);
      } catch {}
      alert('¡Sesión registrada!');
    } catch (e) {
      console.error(e);
      alert(`No se pudo registrar la sesión.\n${e?.message || ''}`);
    }
  };

  if (loading) return <Layout title="Mi Plan (Gym)" showBackButton><div className="p-4">Cargando…</div></Layout>;
  if (!circuit) return <Layout title="Mi Plan (Gym)" showBackButton><div className="p-4">Crea tu primer circuito en Gym para verlo aquí.</div></Layout>;

  return (
    <Layout title="Mi Plan (Gym)" showBackButton>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-violet-200 drop-shadow-[0_2px_8px_rgba(180,80,255,0.25)]">{circuit.name}</h1>
          <div className="flex gap-2">
            <button onClick={()=>setShowReminders(true)} className="px-3 py-1 rounded-xl border border-orange-300/30 bg-orange-400/10 text-orange-100/90 hover:bg-orange-400/20 hover:shadow-[0_0_16px_2px_rgba(255,180,80,0.18)] text-sm">Recordatorios</button>
            <button onClick={load} className="px-3 py-1 rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-100/90 hover:bg-violet-400/20 hover:shadow-[0_0_16px_2px_rgba(180,80,255,0.18)] text-sm">Refrescar</button>
          </div>
        </div>
        <NeonCard className="p-3" hoverable>
          <div className="text-sm opacity-90">
            <span className="mr-4"><span className="opacity-70">Items:</span> <strong>{items.length}</strong></span>
          </div>
        </NeonCard>
        <ul className="list-disc pl-6 text-sm opacity-90 mt-2">
          {items.map((it, i) => (
            <li key={i}>
              {(names[it.ejercicio_id] || it.ejercicio_id)}: {it.series}×{it.reps ?? `${it.tiempo_seg}s`} · descanso {it.descanso_seg ?? 60}s
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs opacity-70">Marca el día como hecho para sumar a tu progreso de Gym.</div>
          <button
            onClick={marcarHecha}
            disabled={doneToday}
            className={`px-3 py-2 rounded-xl text-sm border transition-colors ${doneToday ? 'opacity-60 cursor-default border-white/10 bg-white/5' : 'border-violet-300/20 bg-violet-400/10 hover:bg-violet-400/20 hover:shadow-[0_0_16px_2px_rgba(180,80,255,0.18)]'}`}
            style={{ boxShadow: doneToday ? undefined : '0 0 0 1px rgba(0,255,231,0.28)', animation: doneToday ? undefined : 'neonPulseSoft 2.2s ease-in-out infinite' }}
            aria-label={doneToday ? 'Ya marcado' : 'Marcar como hecho'}
          >
            {doneToday ? 'Hecho hoy' : 'Marcar como hecho'}
          </button>
        </div>

        {showReminders && (
          <NeonCard className="p-4">
            <div className="font-semibold text-white mb-2">Programar recordatorios (Gym)</div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm opacity-80">Hora</label>
              <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="px-2 py-1 rounded bg-white/10 border border-white/15" />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {[1,2,3,4,5,6,7].map(d => (
                <button key={d}
                  onClick={() => setDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])}
                  className={`px-3 py-1 rounded-full text-xs border transition ${days.includes(d) ? 'bg-orange-500/30 border-orange-400/40 text-white' : 'bg-white/10 border-white/15 text-white/80'}`}
                >
                  {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d-1]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={programarRecordatorios} className="px-3 py-2 rounded-xl border border-orange-300/30 bg-orange-400/10 text-orange-100/90">Guardar recordatorios</button>
              <button onClick={()=>setShowReminders(false)} className="px-3 py-2 rounded-xl border border-white/15 bg-white/5">Cerrar</button>
            </div>
          </NeonCard>
        )}
      </div>
    </Layout>
  );
}
