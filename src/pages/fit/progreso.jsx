// Progreso: dashboard con marcos neón, tendencias, anillos y badges
import React, { useMemo } from 'react';
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
import { Flame, Activity, HeartPulse, Target, Trophy, Zap, Timer, Award } from 'lucide-react';
import { useRoutineSummary } from '@/hooks/useRoutineSummary';

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
      `relative rounded-2xl border bg-white/5 border-cyan-300/20 p-4 sm:p-5 shadow-[0_20px_40px_rgba(0,40,80,0.35)] ` +
      `hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)] transition-all duration-300 ${className}`
    }
    style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
  >
    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5" />
    {children}
  </div>
);

export default function FitProgreso() {
  const { streakDias, sesionesSemana, diasSemana, kcalHoy } = useRoutineSummary();

  // Mock de tendencias (últimos 7 días)
  const labels = useMemo(() => ['L', 'M', 'X', 'J', 'V', 'S', 'D'], []);
  const minutos7 = useMemo(() => [30, 42, 0, 25, 50, 60, 35], []);
  const kcal7 = useMemo(() => [210, 320, 0, 180, 390, 480, 300], []);

  const lineData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Minutos',
        data: minutos7,
        borderColor: 'rgba(0,255,231,0.9)',
        backgroundColor: 'rgba(0,255,231,0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      },
      {
        label: 'Kcal',
        data: kcal7,
        borderColor: 'rgba(255,170,0,0.95)',
        backgroundColor: 'rgba(255,170,0,0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        yAxisID: 'y1',
      },
    ],
  }), [labels, minutos7, kcal7]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { color: '#d1f9f6' } },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#a5f3fc' }, grid: { color: 'rgba(0,255,231,0.06)' } },
      y: { ticks: { color: '#a5f3fc' }, grid: { color: 'rgba(0,255,231,0.06)' } },
      y1: { position: 'right', ticks: { color: '#ffd7a1' }, grid: { drawOnChartArea: false } },
    },
  }), []);

  // Donut: avance semanal (minutos vs objetivo)
  const objetivoMin = Math.max(120, (diasSemana || 4) * 30);
  const currentMin = Math.min(minutos7.reduce((a, b) => a + b, 0), objetivoMin);
  const donutData = useMemo(() => ({
    labels: ['Hecho', 'Restante'],
    datasets: [{
      data: [currentMin, Math.max(objetivoMin - currentMin, 0)],
      backgroundColor: ['#00ffe7', 'rgba(0,255,231,0.15)'],
      borderColor: ['#00ffe7', 'rgba(0,255,231,0.25)'],
      borderWidth: 1.5,
      cutout: '75%',
    }],
  }), [currentMin, objetivoMin]);

  const donutOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    animation: { animateRotate: true, duration: 900 },
  }), []);

  // Radar: rendimiento por capacidad
  const radarData = useMemo(() => ({
    labels: ['Fuerza', 'Resistencia', 'Cardio', 'Movilidad', 'Núcleo'],
    datasets: [
      {
        label: 'Tu perfil',
        data: [70, 55, 62, 48, 58],
        backgroundColor: 'rgba(0,255,231,0.14)',
        borderColor: '#00ffe7',
        borderWidth: 1.5,
        pointBackgroundColor: '#00ffe7',
      },
    ],
  }), []);

  const radarOptions = useMemo(() => ({
    responsive: true,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,255,231,0.12)' },
        grid: { color: 'rgba(0,255,231,0.12)' },
        pointLabels: { color: '#a5f3fc', font: { size: 11 } },
        ticks: { showLabelBackdrop: false, color: '#a5f3fc', backdropColor: 'transparent' },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: { legend: { display: false } },
  }), []);

  return (
    <div className="px-4 pb-24 min-h-screen bg-gradient-to-br from-[#0E1A2B] via-[#101a2e] to-[#0a1120] relative overflow-hidden">
      {/* Líneas NASA de fondo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="gridline-prog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ffe7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00ffe7" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[...Array(12)].map((_, i) => (
            <line key={i} x1={(i + 1) * 90} y1="0" x2={(i + 1) * 90} y2="2000" stroke="url(#gridline-prog)" strokeWidth="1" />
          ))}
          {[...Array(8)].map((_, i) => (
            <line key={i} y1={(i + 1) * 120} x1="0" y2={(i + 1) * 120} x2="2000" stroke="url(#gridline-prog)" strokeWidth="1" />
          ))}
        </svg>
      </div>

      {/* Encabezado */}
      <div className="relative z-10 pt-6 pb-4">
        <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-cyan-200 drop-shadow-[0_2px_8px_rgba(0,255,255,0.18)]">
          Progreso
        </h1>
        <p className="text-cyan-100/80 text-sm -mt-1 tracking-tight">Tus métricas, tendencias e insignias</p>
      </div>

      {/* KPIs rápidos */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <NeonCard>
          <div className="flex items-center gap-2 text-cyan-100">
            <Timer className="h-4 w-4 text-cyan-300" />
            <div className="text-xs opacity-80">Racha</div>
          </div>
          <div className="mt-1 text-white text-lg font-bold">{streakDias} {streakDias === 1 ? 'día' : 'días'}</div>
        </NeonCard>
        <NeonCard>
          <div className="flex items-center gap-2 text-cyan-100">
            <Target className="h-4 w-4 text-cyan-300" />
            <div className="text-xs opacity-80">Semana</div>
          </div>
          <div className="mt-1 text-white text-lg font-bold">{sesionesSemana}/{diasSemana || 4} sesiones</div>
        </NeonCard>
        <NeonCard>
          <div className="flex items-center gap-2 text-cyan-100">
            <Flame className="h-4 w-4 text-amber-300 drop-shadow-[0_0_8px_rgba(255,170,0,0.7)]" />
            <div className="text-xs opacity-80">Kcal hoy</div>
          </div>
          <div className="mt-1 text-white text-lg font-bold">{kcalHoy || 0}</div>
        </NeonCard>
        <NeonCard>
          <div className="flex items-center gap-2 text-cyan-100">
            <HeartPulse className="h-4 w-4 text-rose-300 drop-shadow-[0_0_8px_rgba(255,70,120,0.7)]" />
            <div className="text-xs opacity-80">HR medio</div>
          </div>
          <div className="mt-1 text-white text-lg font-bold">86 bpm</div>
        </NeonCard>
      </div>

      {/* Grids principales */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4">
        {/* Tendencias */}
        <NeonCard className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-300" />
              <div className="text-white font-semibold">Tendencias (7 días)</div>
            </div>
            <div className="text-xs text-cyan-100/80">Min vs Kcal</div>
          </div>
          <div className="h-[220px] sm:h-[260px] mt-2">
            <Line data={lineData} options={lineOptions} />
          </div>
        </NeonCard>

        {/* Anillo avance semanal */}
        <NeonCard>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-300" />
            <div className="text-white font-semibold">Avance semanal</div>
          </div>
          <div className="mt-1 text-xs text-cyan-100/80">Objetivo: {objetivoMin} min</div>
          <div className="relative flex items-center justify-center h-[220px]">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-50 bg-cyan-400/30" />
            <div className="w-[180px] h-[180px]">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
            <div className="absolute text-center">
              <div className="text-2xl font-extrabold text-white">{currentMin}</div>
              <div className="text-[11px] text-cyan-100/80 -mt-1">min</div>
            </div>
          </div>
        </NeonCard>
      </div>

      {/* Radar + Badges */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4">
        <NeonCard className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-300" />
            <div className="text-white font-semibold">Perfil de rendimiento</div>
          </div>
          <div className="h-[280px] sm:h-[320px] mt-2">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </NeonCard>

        <NeonCard>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-300 drop-shadow-[0_0_8px_rgba(255,170,0,0.7)]" />
            <div className="text-white font-semibold">Insignias</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[{ t: 'Racha 7', c: 'Racha de 7 días' }, { t: 'Cardio+', c: 'HR > 25 min' }, { t: 'Fuerza', c: '5 sesiones' }].map((b, i) => (
              <div key={i} className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-cyan-300/20 hover:bg-cyan-400/10 transition">
                <Award className="h-6 w-6 text-amber-300 drop-shadow-[0_0_8px_rgba(255,170,0,0.7)]" />
                <div className="mt-1 text-[11px] text-center text-cyan-100/90 font-semibold">{b.t}</div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-cyan-100/80 opacity-0 group-hover:opacity-100 transition">{b.c}</div>
              </div>
            ))}
          </div>
        </NeonCard>
      </div>
    </div>
  );
}
