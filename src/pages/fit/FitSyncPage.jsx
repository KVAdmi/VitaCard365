import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRunTracking } from '@/hooks/useRunTracking';
import NativeMap from '../../components/fit/NativeMap';
import { useNativeHeartRate } from '@/hooks/useNativeHeartRate';
import { supabase } from '@/lib/supabaseClient';
import KeepAliveAccordion from '../../components/ui/KeepAliveAccordion';
import GymBlePanel from '../../components/fit/GymBlePanel';
import WearablesPanel from '../../components/fit/WearablesPanel';

import Layout from '../../components/Layout';

export default function FitSyncPage() {
  const { start, pause, resume, stop, isTracking, isPaused, stats } = useRunTracking();
  const [hud, setHud] = useState({ distance_km: 0, duration_s: 0, pace_min_km: 0, kcal: 0 });

  // Selección de API key por plataforma
  const key = Capacitor.getPlatform() === 'ios'
    ? import.meta.env.VITE_MAPS_IOS_KEY
    : import.meta.env.VITE_MAPS_ANDROID_KEY;

  // Log al render para confirmar la key recibida
  useEffect(() => {
    console.log('[FitSyncPage] Plataforma:', Capacitor.getPlatform());
    console.log('[FitSyncPage] MAPS key (masked):', typeof key === 'string' ? key?.slice(0, 8) + '...' : key);
  }, [key]);

  // Sincroniza HUD cuando llegan nuevas stats desde el hook
  useEffect(() => {
    setHud(stats);
  }, [stats]);

  // Cronómetro en tiempo real (+1s cada segundo) mientras tracking y no en pausa
  useEffect(() => {
    if (!isTracking || isPaused) return;
    const id = setInterval(() => {
      setHud((h) => ({ ...h, duration_s: h.duration_s + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [isTracking, isPaused]);
  // Pulso BLE/web
  const [webHr, setWebHr] = useState(null);
  const [hrSamples, setHrSamples] = useState([]); // Para promedio
  // Pulso nativo (Capacitor)
  const { hr: nativeHr, status: nativeStatus, scanAndConnect } = useNativeHeartRate();
  const [userId, setUserId] = useState(null);

  // Formateadores
  const fmtTime = (s) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), ss = s%60;
    return [h,m,ss].map(v => String(v).padStart(2,'0')).join(':');
  };
const fmtPace = (pace, dist) => {
  if (!dist || dist < 0.01 || !pace || !isFinite(pace) || pace <= 0) return '—';
  let shownPace = pace;
  if (pace > 20) shownPace = 20;
  const min = Math.floor(shownPace);
  const sec = Math.round((shownPace % 1) * 60);
  return `${min}:${String(sec).padStart(2, '0')} min/km`;
};

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error('auth error:', error);
      const id = data?.user?.id ?? null;
      setUserId(id);
      window.__user_id = id;
      console.log('Auth userId:', id);
    });
  }, []);

  // Actualiza promedio de pulso
  useEffect(() => {
    const hr = webHr ?? nativeHr;
    if (hr && !isNaN(hr)) {
      setHrSamples((arr) => arr.length > 300 ? arr.slice(-299).concat(hr) : arr.concat(hr));
    }
  }, [webHr, nativeHr]);

  // Recibe pulso web desde GymBlePanel
  const handleWebHr = (hr) => setWebHr(hr);

  // Calcula promedio
  const hrAvg = hrSamples.length ? Math.round(hrSamples.reduce((a,b) => a+b, 0) / hrSamples.length) : null;
  const pulsoActual = webHr ?? nativeHr;
  const pulsoFuente = webHr ? 'web' : (nativeHr ? 'nativo' : null);

  return (
    <Layout title="Sincronizar mi rutina" showBackButton>
      <div className="min-h-screen w-full flex justify-center items-start">
        <div className="w-full max-w-4xl px-2 sm:px-6 py-6 sm:py-10">
          {/* Tarjeta única contenedora modo NASA */}
          <div className="rounded-2xl border border-teal-400/30 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(92,233,225,.15)] ring-1 ring-teal-300/10 p-2 sm:p-6 space-y-3 sm:space-y-4">
            {/* 1) Running */}
            <KeepAliveAccordion
              title="Running — Ruta libre"
              defaultOpen
            >
              <div className="relative nasa-glow rounded-xl border border-cyan-300/40 bg-white/5 shadow-[0_0_24px_rgba(92,233,225,.18)] ring-2 ring-cyan-300/30 p-2 sm:p-3 overflow-hidden">
                {/* Mapa nativo Google Maps */}
                <div className="relative isolate z-0 h-[200px] xs:h-[260px] sm:h-[320px] overflow-hidden">
                  <NativeMap apiKey={key} />

                </div>

                {/* HUD 3x2/2x3 */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <HUD label="Distancia" value={hud.distance_km.toFixed(2) + ' km'} />
                  <HUD label="Tiempo" value={fmtTime(hud.duration_s)} />
                  <HUD label="Ritmo" value={fmtPace(hud.pace_min_km, hud.distance_km)} />
                  <HUD label="Calorías" value={Math.round(hud.kcal)} />
                  <HUD label="Pulso actual" value={pulsoActual ? pulsoActual + ' bpm' : '—'} fuente={pulsoFuente} />
                  <HUD label="Pulso promedio" value={hrAvg ? hrAvg + ' bpm' : '—'} />
                </div>

                {/* Controles */}
                <div className="mt-3 grid grid-cols-2 sm:flex gap-2 sm:gap-3 justify-center">
                  <Btn 
                    variant="start" 
                    onClick={start} 
                    disabled={!userId}
                  >
                    Iniciar
                  </Btn>
                  <Btn 
                    variant="pause" 
                    onClick={pause} 
                    disabled={!userId}
                  >
                    Pausar
                  </Btn>
                  <Btn 
                    variant="start" 
                    onClick={resume} 
                    disabled={!userId}
                  >
                    Continuar
                  </Btn>
                  <Btn 
                    variant="stop" 
                    onClick={stop} 
                    disabled={!userId}
                  >
                    Terminar
                  </Btn>
                </div>
              </div>
            </KeepAliveAccordion>

           {/* 2) Gym BLE */}
          <GymBlePanel onHr={handleWebHr} />
            {/* 3) Wearables */}
            <KeepAliveAccordion title="Conectar mi dispositivo" defaultOpen>
              <WearablesPanel />
            </KeepAliveAccordion>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function HUD({ label, value, fuente }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1626]/70 backdrop-blur text-white tabular-nums tracking-wide px-3 py-2 nasa-blue-glow animate-nasa-blue-glow">
      <div className="text-xs text-white/70 flex items-center gap-1">{label}
        {fuente && (
          <span className="ml-1 text-[10px] px-1 rounded bg-cyan-700/60 text-white/80 border border-cyan-400/30">{fuente}</span>
        )}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Btn({ children, variant, ...props }) {
  const styles = {
    start: 'bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,.45)]',
    pause: 'bg-amber-300 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,.4)]',
    stop:  'bg-rose-400 text-slate-900 shadow-[0_0_20px_rgba(244,63,94,.45)]',
  }[variant];
  return (
    <button type="button" className={`px-4 py-2 rounded-xl border border-white/10 hover:brightness-110 active:brightness-95 transition ${styles}`} {...props}>
      {children}
    </button>
  );
}

