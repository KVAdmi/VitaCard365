import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
);

const NeonCard = ({ children, className = '' }) => (
  <div
    className={
      `relative rounded-2xl border bg-white/5 border-violet-300/20 p-4 sm:p-5 shadow-[0_20px_40px_rgba(60,0,120,0.35)] ` +
      `hover:shadow-[0_0_32px_4px_rgba(180,80,255,0.18)] transition-all duration-300 ${className}`
    }
    style={{ boxShadow: '0 0 0 1.5px #b388ff, 0 20px 40px rgba(60,0,120,0.35)' }}
  >
    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5" />
    {children}
  </div>
);

export default function GymProgreso() {
  const [labels, setLabels] = useState(['L','M','X','J','V','S','D']);
  const [minutos7, setMinutos7] = useState([0,0,0,0,0,0,0]);
  const [kcal7, setKcal7] = useState([0,0,0,0,0,0,0]);
  const [streakDias, setStreakDias] = useState(0);
  const [sesionesSemana, setSesionesSemana] = useState(0);
  const [kcalHoy, setKcalHoy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [diasSemParam, setDiasSemParam] = useState(4);
  const [minSesionParam, setMinSesionParam] = useState(30);

  useEffect(()=>{ (async()=>{
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) { setLoading(false); return; }
    // últimos 7 días de gym_sessions
    const hoy = new Date();
    const desde = new Date(hoy); desde.setDate(hoy.getDate()-6);
    const { data } = await supabase
      .from('gym_sessions')
      .select('started_at,minutos,kcal')
      .eq('user_id', uid)
      .gte('started_at', desde.toISOString())
      .lte('started_at', hoy.toISOString());
    // Etiquetas por día (L..D)
    const dias = ['D','L','M','X','J','V','S'];
    const keys = [];
    for (let i=6;i>=0;i--) { const d = new Date(hoy); d.setDate(hoy.getDate()-i); keys.push(d); }
    setLabels(keys.map(d => dias[d.getDay()]));
    const bucket = new Array(7).fill(0).map(()=>({min:0,kcal:0}));
    const idxByDay = (d) => {
      const base = new Date(hoy); base.setHours(0,0,0,0);
      const day0 = new Date(d); day0.setHours(0,0,0,0);
      const diff = Math.floor((day0 - (new Date(base.getTime()-6*86400000))) / 86400000);
      return diff;
    };
    (data||[]).forEach(w=>{
      const idx = idxByDay(new Date(w.started_at));
      if (idx>=0 && idx<7) { bucket[idx].min += w.minutos||0; bucket[idx].kcal += w.kcal||0; }
    });
    setMinutos7(bucket.map(b=>b.min));
    setKcal7(bucket.map(b=>b.kcal));
    setKcalHoy(bucket[6]?.kcal || 0);
    setSesionesSemana(bucket.reduce((acc,b)=> acc + ((b.min||0)>0 ? 1 : 0), 0));
    let streak = 0; for (let i=6;i>=0;i--){ if ((bucket[i]?.min||0)>0) streak++; else break; }
    setStreakDias(streak);
    // Leer parámetros del plan Gym (si existen) para meta semanal
    try {
      const p = JSON.parse(localStorage.getItem('vc.gym.params') || 'null');
      if (p) {
        if (p.diasSemana) setDiasSemParam(Number(p.diasSemana));
        if (p.minutos) setMinSesionParam(Number(p.minutos));
      }
    } catch {}
    setLoading(false);
  })(); }, []);

  const lineData = useMemo(() => ({
    labels,
    datasets: [
      { label: 'Minutos', data: minutos7, borderColor: 'rgba(180,80,255,0.95)', backgroundColor: 'rgba(180,80,255,0.18)', fill: true, tension: 0.35, pointRadius: 0 },
      { label: 'Kcal', data: kcal7, borderColor: 'rgba(255,170,0,0.95)', backgroundColor: 'rgba(255,170,0,0.14)', fill: true, tension: 0.35, pointRadius: 0, yAxisID: 'y1' },
    ],
  }), [labels, minutos7, kcal7]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: true, labels: { color: '#e9d5ff' } } },
    scales: {
      x: { ticks: { color: '#e9d5ff' }, grid: { color: 'rgba(179,136,255,0.10)' } },
      y: { ticks: { color: '#e9d5ff' }, grid: { color: 'rgba(179,136,255,0.10)' } },
      y1: { position: 'right', ticks: { color: '#ffd7a1' }, grid: { drawOnChartArea: false } },
    },
  }), []);

  // Objetivo dinámico: primero por parámetros (días/semana × minutos/sesión), si no existen, estimar por circuito
  const [objetivoMin, setObjetivoMin] = useState(120);
  useEffect(()=>{ (async()=>{
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id; if (!uid) return;
      // Si hay parámetros válidos, úsalos
      if (diasSemParam && minSesionParam) {
        const meta = Math.max(60, Number(diasSemParam) * Number(minSesionParam));
        setObjetivoMin(meta);
      }
      const { data: cs } = await supabase.from('gym_circuits').select('id').eq('user_id', uid).order('updated_at', { ascending: false }).limit(1);
      const c = cs?.[0]; if (!c) return;
      const { data: its } = await supabase.from('gym_circuit_items').select('series,reps,descanso_seg').eq('circuit_id', c.id);
      if (its && its.length) {
        const totalSeg = its.reduce((acc,it)=> acc + (Number(it.series||1) * ((Number(it.reps||10)*3) + Number(it.descanso_seg||60))), 0);
        const min = Math.max(20, Math.round(totalSeg/60));
        // Solo usa estimación del circuito si no hay parámetros guardados
        if (!(diasSemParam && minSesionParam)) setObjetivoMin(min);
      }
    } catch {}
  })(); }, [diasSemParam, minSesionParam]);
  const totalMin = Math.min(minutos7.reduce((a,b)=>a+b,0), objetivoMin);
  const donutData = useMemo(() => ({
    labels: ['Hecho', 'Restante'],
    datasets: [{ data: [totalMin, Math.max(objetivoMin - totalMin, 0)], backgroundColor: ['#b388ff', 'rgba(179,136,255,0.18)'], borderColor: ['#b388ff','rgba(179,136,255,0.28)'], borderWidth: 1.5, cutout: '75%' }],
  }), [totalMin]);
  const donutOptions = useMemo(() => ({ responsive: true, plugins: { legend: { display: false } } }), []);

  const radarData = useMemo(() => ({
    labels: ['Fuerza','Resistencia','Cardio','Movilidad','Núcleo'],
    datasets: [{ label: 'Tu perfil', data: [70, 55, 62, 48, 58], backgroundColor: 'rgba(179,136,255,0.18)', borderColor: '#b388ff', borderWidth: 1.5, pointBackgroundColor: '#b388ff' }],
  }), []);
  const radarOptions = useMemo(() => ({ responsive: true, scales: { r: { angleLines: { color: 'rgba(179,136,255,0.15)' }, grid: { color: 'rgba(179,136,255,0.15)' }, pointLabels: { color: '#e9d5ff', font: { size: 11 } }, ticks: { showLabelBackdrop: false, color: '#e9d5ff', backdropColor: 'transparent' } } }, plugins: { legend: { display: false } } }), []);

  if (loading) return <Layout title="Progreso (Gym)" showBackButton><div className="p-4">Cargando…</div></Layout>;

  return (
    <Layout title="Progreso (Gym)" showBackButton>
      <div className="px-4 pb-24 min-h-screen bg-gradient-to-br from-[#0E1224] via-[#0f0f22] to-[#0a0b1a] relative overflow-hidden">
        <div className="pt-4 pb-2">
          <button onClick={() => { try { history.back(); } catch {} }} className="text-violet-100/80 hover:text-white text-sm border border-violet-300/20 rounded-lg px-3 py-1 bg-violet-400/10">← Regresar</button>
        </div>

        <div className="relative z-10 pt-2 pb-4">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-violet-200 drop-shadow-[0_2px_8px_rgba(180,80,255,0.25)]">Progreso (Gym)</h1>
          <p className="text-violet-100/85 text-sm -mt-1 tracking-tight">Tus métricas de circuito, tendencias e insignias</p>
        </div>

        {/* KPIs rápidos */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <NeonCard><div className="text-xs opacity-80">Constancia</div><div className="mt-1 text-white text-lg font-bold">{streakDias} {streakDias===1?'día':'días'}</div></NeonCard>
          <NeonCard><div className="text-xs opacity-80">Semana</div><div className="mt-1 text-white text-lg font-bold">{sesionesSemana}/{diasSemParam} sesiones</div></NeonCard>
          <NeonCard><div className="text-xs opacity-80">Kcal hoy</div><div className="mt-1 text-white text-lg font-bold">{kcalHoy}</div></NeonCard>
          <NeonCard><div className="text-xs opacity-80">HR medio</div><div className="mt-1 text-white text-lg font-bold">—</div></NeonCard>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4">
          <NeonCard className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">Tendencias (7 días)</div>
              <div className="text-xs text-violet-100/80">Min vs Kcal</div>
            </div>
            <div className="h-[220px] sm:h-[260px] mt-2">
              <Line data={lineData} options={lineOptions} />
            </div>
          </NeonCard>
          <NeonCard>
            <div className="text-white font-semibold">Avance semanal</div>
            <div className="mt-1 text-xs text-violet-100/80">Objetivo: {objetivoMin} min</div>
            <div className="relative flex items-center justify-center h-[220px]">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40 bg-violet-400/30" />
              <div className="w-[180px] h-[180px]"><Doughnut data={donutData} options={donutOptions} /></div>
              <div className="absolute text-center">
                <div className="text-2xl font-extrabold text-white">{totalMin}</div>
                <div className="text-[11px] text-violet-100/80 -mt-1">min</div>
              </div>
            </div>
          </NeonCard>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4">
          <NeonCard className="md:col-span-2">
            <div className="text-white font-semibold">Perfil de rendimiento</div>
            <div className="h-[280px] sm:h-[320px] mt-2"><Radar data={radarData} options={radarOptions} /></div>
          </NeonCard>
          <NeonCard>
            <div className="text-white font-semibold">Insignias</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[{ t: 'Constancia 7', c: '7 días seguidos' }, { t: 'Cardio+', c: 'HR > 25 min' }, { t: 'Fuerza', c: '5 sesiones' }].map((b, i) => (
                <div key={i} className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-violet-300/20 hover:bg-violet-400/10 transition">
                  <div className="h-6 w-6 rounded-full bg-violet-300/20 border border-violet-300/40" />
                  <div className="mt-1 text-[11px] text-center text-violet-100/90 font-semibold">{b.t}</div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-violet-100/80 opacity-0 group-hover:opacity-100 transition">{b.c}</div>
                </div>
              ))}
            </div>
          </NeonCard>
        </div>
      </div>
    </Layout>
  );
}
