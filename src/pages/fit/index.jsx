import React from 'react';
import VitaCard365Logo from '../../components/Vita365Logo';
import Layout from '../../components/Layout';
// Página principal de FIT

import { Link, Outlet, useLocation } from "react-router-dom";
import { Bluetooth, Dumbbell, ListChecks, Salad, LineChart, Play } from "lucide-react";
import { Dumbbell as GymIcon } from "lucide-react";
import { useRoutineSummary } from '@/hooks/useRoutineSummary';

const iconGlow = {
  sync: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,255,255,0.7)]',
  create: 'text-green-300 drop-shadow-[0_0_8px_rgba(34,255,120,0.7)]',
  plan: 'text-blue-400 drop-shadow-[0_0_8px_rgba(80,180,255,0.7)]',
  nutricion: 'text-pink-300 drop-shadow-[0_0_8px_rgba(255,80,200,0.7)]',
  progreso: 'text-violet-300 drop-shadow-[0_0_8px_rgba(180,80,255,0.7)]',
  gym: 'text-violet-300 drop-shadow-[0_0_8px_rgba(180,80,255,0.7)]',
};

const Tile = ({ to, Icon, title, subtitle, glow }) => (
  <Link
    to={to}
    className="group relative flex flex-col items-center justify-center h-[140px] w-[160px] sm:h-[160px] sm:w-[180px]
               rounded-2xl border border-cyan-400/20 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(0,40,80,0.45)]
               transition-all duration-200 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)] hover:-translate-y-1 active:scale-[0.97]"
    style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
  >
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 p-2 shadow-[0_0_16px_2px_rgba(0,255,255,0.18)] group-hover:scale-110 transition-transform">
      <Icon className={`h-6 w-6 ${glow} transition-all duration-200`} />
    </div>
    <div className="mt-4 text-sm font-semibold text-white text-center tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">{title}</div>
    {subtitle && <div className="mt-1 text-[11px] text-cyan-100/80 text-center tracking-tight">{subtitle}</div>}
    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30 transition-all" />
  </Link>
);

class FitErrorBoundary extends React.Component { 
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ console.error('[FIT] render error', error, info); }
  render(){
    if (this.state.hasError) {
      return (
        <Layout title="Fitness" showBackButton>
          <div className="p-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
              <div className="font-semibold">Estamos restableciendo Fitness…</div>
              <div className="text-sm opacity-80">Intenta regresar a esta pantalla. Si persiste, reinicia la app.</div>
            </div>
          </div>
        </Layout>
      );
    }
    return this.props.children;
  }
}

export default function FitPage() {
  const location = useLocation();
  const isRoot = location.pathname === "/fit";
  const { streakDias, sesionesSemana, diasSemana, kcalHoy } = useRoutineSummary();
  if (!isRoot) return <Outlet />;
  return (
    <FitErrorBoundary>
      <Layout title="Fitness" showBackButton>
  <div className="px-4 pb-24 min-h-screen relative overflow-hidden">
          {/* NASA grid lines */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" className="w-full h-full" style={{position:'absolute',top:0,left:0}}>
              <defs>
                <linearGradient id="gridline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ffe7" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#00ffe7" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[...Array(12)].map((_,i)=>(<line key={i} x1={(i+1)*90} y1="0" x2={(i+1)*90} y2="2000" stroke="url(#gridline)" strokeWidth="1" />))}
              {[...Array(8)].map((_,i)=>(<line key={i} y1={(i+1)*120} x1="0" y2={(i+1)*120} x2="2000" stroke="url(#gridline)" strokeWidth="1" />))}
            </svg>
          </div>
          {/* Logo VitaCard365 encabezado grande */}
          <div className="w-full flex flex-col items-center justify-center mt-6 mb-4 relative z-20">
            <VitaCard365Logo className="w-[260px] sm:w-[340px] drop-shadow-[0_12px_48px_rgba(0,255,255,0.32)] brightness-110 contrast-125" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[120px] rounded-full blur-2xl opacity-50 bg-cyan-400/40 z-[-1]" />
          </div>
          {/* Hero */}
          <div className="max-w-[1100px] mx-auto mb-6 flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-cyan-200 drop-shadow-[0_2px_8px_rgba(0,255,255,0.18)]">Fitness</h1>
              <p className="text-cyan-100/80 text-sm -mt-1 tracking-tight">Tu entrenador inteligente, integrado con tu salud.</p>
            </div>
            {/* (Removido) botón Continuar */}
          </div>
          {/* KPIs compactos */}
          <div className="max-w-[1100px] mx-auto grid grid-cols-3 gap-3 sm:gap-4 mb-12 relative z-10">
            <div className="rounded-xl bg-cyan-400/10 border border-cyan-300/20 px-3 py-2 text-cyan-100/90 text-xs shadow-[0_2px_8px_rgba(0,255,255,0.08)]">
              Constancia: <span className="font-semibold text-cyan-50">{streakDias} {streakDias===1?'día':'días'}</span>
            </div>
            <div className="rounded-xl bg-cyan-400/10 border border-cyan-300/20 px-3 py-2 text-cyan-100/90 text-xs shadow-[0_2px_8px_rgba(0,255,255,0.08)]">
              Semana: <span className="font-semibold text-cyan-50">{sesionesSemana}/{diasSemana} sesiones</span>
            </div>
            <div className="rounded-xl bg-cyan-400/10 border border-cyan-300/20 px-3 py-2 text-cyan-100/90 text-xs shadow-[0_2px_8px_rgba(0,255,255,0.08)]">
              Kcal hoy: <span className="font-semibold text-cyan-50">{kcalHoy}</span>
            </div>
          </div>
          {/* Grid: 2 tarjetas + recordatorio de nutrición como tercera tarjeta (mismo tamaño) */}
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-8 sm:gap-y-12 place-items-center relative z-10 px-2">
            <Link
              to="/fit/sync"
              className="group relative flex flex-col items-center justify-center h-[170px] w-full max-w-[320px] sm:h-[200px] sm:w-[260px] rounded-2xl border border-cyan-400/20 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(0,40,80,0.45)] transition-all duration-200 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)] hover:-translate-y-1 active:scale-[0.97]"
              style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 p-2 shadow-[0_0_16px_2px_rgba(0,255,255,0.18)] group-hover:scale-110 transition-transform">
                <Bluetooth className={`h-6 w-6 ${iconGlow.sync} transition-all duration-200`} />
              </div>
              <div className="mt-4 text-base font-semibold text-white text-center tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Sincronizar rutina</div>
              <div className="mt-1 text-[12px] text-cyan-100/80 text-center tracking-tight">FTMS • HRS • Wearables</div>
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30 transition-all" />
            </Link>

            {/* Crear rutina en Casa (flujo existente) */}
            <Link
              to="/fit/create"
              className="group relative flex flex-col items-center justify-center h-[170px] w-full max-w-[320px] sm:h-[200px] sm:w-[260px] rounded-2xl border border-cyan-400/20 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(0,40,80,0.45)] transition-all duration-200 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)] hover:-translate-y-1 active:scale-[0.97]"
              style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 p-2 shadow-[0_0_16px_2px_rgba(0,255,255,0.18)] group-hover:scale-110 transition-transform">
                <Dumbbell className={`h-6 w-6 ${iconGlow.create} transition-all duration-200`} />
              </div>
              <div className="mt-4 text-base font-semibold text-white text-center tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Crear rutina (Casa)</div>
              <div className="mt-1 text-[12px] text-cyan-100/80 text-center tracking-tight">Objetivo • Casa • Nivel</div>
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30 transition-all" />
            </Link>

            <Link
              to="/fit/gym/catalog"
              className="group relative flex flex-col items-center justify-center h-[170px] w-full max-w-[320px] sm:h-[200px] sm:w-[260px] rounded-2xl border border-cyan-400/20 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(0,40,80,0.45)] transition-all duration-200 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)] hover:-translate-y-1 active:scale-[0.97]"
              style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 p-2 shadow-[0_0_16px_2px_rgba(0,255,255,0.18)] group-hover:scale-110 transition-transform">
                <GymIcon className={`h-6 w-6 ${iconGlow.gym} transition-all duration-200`} />
              </div>
              <div className="mt-4 text-base font-semibold text-white text-center tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Crear rutina (Gym)</div>
              <div className="mt-1 text-[12px] text-cyan-100/80 text-center tracking-tight">Catálogo • Circuito • Runner</div>
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30 transition-all" />
            </Link>

            {/* (Removido) Accesos directos Gym: Plan y Progreso — ahora viven dentro de Crear rutina (Gym) */}

            {/* Tarjeta: Asistencia Fitness 24/7 (nutrición) con mismo tamaño y estilo */}
            <Link
              to="/coberturas?cat=fitness"
              className="group relative flex flex-col items-center justify-center h-[170px] w-full max-w-[320px] sm:h-[200px] sm:w-[260px] rounded-2xl border border-cyan-400/20 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(0,40,80,0.45)] transition-all duration-200 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)] hover:-translate-y-1 active:scale-[0.97]"
              style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-cyan-300/30 bg-cyan-400/10 p-2 shadow-[0_0_16px_2px_rgba(0,255,255,0.18)] group-hover:scale-110 transition-transform">
                <ListChecks className={`h-6 w-6 ${iconGlow.nutricion} transition-all duration-200`} />
              </div>
              <div className="mt-4 text-base font-semibold text-white text-center tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Asistencia Fitness 24/7</div>
              <div className="mt-1 text-[12px] text-cyan-100/80 text-center tracking-tight">Nutrición y entrenamiento con expertos</div>
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30 transition-all" />
            </Link>
          </div>

          {/* Imagen de marca al fondo */}
          <div className="max-w-[1100px] mx-auto mt-10 pb-24 relative z-10 flex justify-center">
            <img src="/branding/9.png" alt="VitaCard 365" className="w-full max-w-md opacity-90" loading="lazy" />
          </div>
        </div>
      </Layout>
    </FitErrorBoundary>
  );
}
