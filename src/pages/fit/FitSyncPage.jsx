import React, { useState, useEffect } from 'react';
// Formateadores auxiliares
function fmtTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return [h, m, ss].map(v => String(v).padStart(2, '0')).join(':');
}

function fmtPace(pace, dist) {
  if (!dist || dist < 0.01 || !pace || !isFinite(pace) || pace <= 0) return '—';
  let shownPace = pace;
  if (pace > 20) shownPace = 20;
  const min = Math.floor(shownPace);
  const sec = Math.round((shownPace % 1) * 60);
  return `${min}:${String(sec).padStart(2, '0')} min/km`;
}
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
// import eliminado: PermissionsAndroid, Platform
import { useRunTracking } from '@/hooks/useRunTracking';
import MapView from '../../components/fit/MapView';
import { supabase } from '@/lib/supabaseClient';
import { sessionHub } from '@/fit/sessionHub';
import KeepAliveAccordion from '../../components/ui/KeepAliveAccordion';
import GymBlePanel from '../../components/fit/GymBlePanel';
import Layout from '../../components/Layout';


export default function FitSyncPage() {
  // Estado para métricas HUD
  const [hud, setHud] = useState({ distance_km: 0, duration_s: 0, pace_min_km: 0, kcal: 0 });
  const [extra, setExtra] = useState({ cad_rpm: null, power_w: null, resistance: null, incline_pct: null, battery_pct: null });
  // Hook de tracking por GPS (fallback de métricas cuando no vienen del hub)
  const { start: tStart, pause: tPause, resume: tResume, stop: tStop, stats: tStats } = useRunTracking();
  // Simulación de pulso (puedes conectar a BLE real si lo deseas)
  const [pulsoActual, setPulsoActual] = useState(null);
  const [hrSamples, setHrSamples] = useState([]);
  // Simulación de tracking (puedes conectar a hooks reales si lo deseas)
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inicioTs, setInicioTs] = useState(null);

  // Estado para el centro del mapa
  const [center, setCenter] = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState(null);
  const geoWatchIdRef = React.useRef(null);

  // Localización con fallback y reintento
  const requestCenter = async () => {
    setLocLoading(true);
    setLocError(null);
    try {
      await Geolocation.requestPermissions();
      // Primer intento: más rápido, menor precisión
      try {
        const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 3000 });
        setCenter({ lat: coords.latitude, lng: coords.longitude });
      } catch {
        // Segundo intento: alta precisión
        const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
        setCenter({ lat: coords.latitude, lng: coords.longitude });
      }

      // Iniciar watch en nativo
      const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
      if (isNative && !geoWatchIdRef.current) {
        try {
          geoWatchIdRef.current = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
            if (err || !pos || !pos.coords) return;
            setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        } catch {}
      }
    } catch (e) {
      setLocError('No se pudo obtener tu ubicación.');
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => {
    requestCenter();
    return () => {
      if (geoWatchIdRef.current != null) {
        try { Geolocation.clearWatch({ id: geoWatchIdRef.current }); } catch {}
        geoWatchIdRef.current = null;
      }
    };
  }, []);

  // Controles mínimos para que compile y funcione el HUD simulado
  const start = () => { setIsTracking(true); setIsPaused(false); setInicioTs(new Date()); try { tStart(); } catch {} };
  const pause = () => { setIsPaused(true); try { tPause(); } catch {} };
  const resume = () => { setIsPaused(false); try { tResume(); } catch {} };
  const stop = async () => {
    const fin = new Date();
    // Guardar entreno (workout) si hay sesión válida y usuario autenticado
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (uid && inicioTs) {
        const minutos = Math.max(0, Math.round(hud.duration_s / 60));
        const distancia_km = Number((hud.distance_km || 0).toFixed(3));
        const kcal = Math.max(0, Math.round(hud.kcal || 0));
        const hr_avg = hrSamples.length ? Math.round(hrSamples.reduce((a,b)=>a+b,0)/hrSamples.length) : null;
        await supabase.from('workouts').insert({
          user_id: uid,
          ts_inicio: inicioTs.toISOString(),
          ts_fin: fin.toISOString(),
          minutos, distancia_km, kcal, hr_avg,
        });
      }
    } catch {}
    setIsTracking(false); setIsPaused(false); setInicioTs(null);
    setHud({ distance_km: 0, duration_s: 0, pace_min_km: 0, kcal: 0 }); setPulsoActual(null); setHrSamples([]);
    try { tStop(); } catch {}
  };

  useEffect(() => {
    if (!isTracking || isPaused) return;
    const id = setInterval(() => {
      setHud(h => ({ ...h, duration_s: h.duration_s + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [isTracking, isPaused]);

  // Suscribirse al hub 1 Hz para enriquecer HUD sin romper flujo manual
  useEffect(() => {
    sessionHub.start();
    const off = sessionHub.onTick((t) => {
      // Pulso actual y avg si no está en pausa
      if (!isPaused) {
        if (t.values.hr_bpm != null && !t.stale.hr_bpm) {
          setPulsoActual(Math.round(t.values.hr_bpm));
          setHrSamples(arr => {
            const next = (arr.length > 300 ? arr.slice(-299) : arr).concat(Math.round(t.values.hr_bpm));
            return next;
          });
        }
        // Distancia preferente FTMS (si el hub trae), si no, conservamos la de GPS actual
        if (t.values.distance_km != null && !t.stale.distance_km) {
          setHud(h => ({ ...h, distance_km: Number(t.values.distance_km.toFixed(2)) }));
        }
        // Velocidad/paso
        if (t.values.speed_kmh != null && !t.stale.speed_kmh) {
          const kmh = t.values.speed_kmh;
          const pace = 60 / (kmh || 0.000001);
          setHud(h => ({ ...h, pace_min_km: pace }));
        }
        // Kcal si vienen
        if (t.values.kcal != null && !t.stale.kcal) {
          setHud(h => ({ ...h, kcal: t.values.kcal }));
        }
        // Extras
        setExtra(prev => ({
          cad_rpm: t.values.cad_rpm != null && !t.stale.cad_rpm ? Math.round(t.values.cad_rpm) : prev.cad_rpm,
          power_w: t.values.power_w != null && !t.stale.power_w ? Math.round(t.values.power_w) : prev.power_w,
          resistance: t.values.resistance != null && !t.stale.resistance ? Math.round(t.values.resistance) : prev.resistance,
          incline_pct: t.values.incline_pct != null && !t.stale.incline_pct ? Math.round(t.values.incline_pct) : prev.incline_pct,
          battery_pct: t.values.battery_pct != null && !t.stale.battery_pct ? Math.round(t.values.battery_pct) : prev.battery_pct,
        }));
      }
    });
    return () => { off(); sessionHub.stop(); };
  }, [isPaused]);

  const hrAvg = hrSamples.length ? Math.round(hrSamples.reduce((a, b) => a + b, 0) / hrSamples.length) : null;

  return (
    <Layout title="Sincronizar mi rutina" showBackButton>
      <div className="min-h-screen w-full flex justify-center items-start fit-sync-page">
        <div className="w-full max-w-4xl px-2 sm:px-6 py-6 sm:py-10">
          <div data-flat="true" className="rounded-2xl border border-teal-400/30 bg-white/5 ring-1 ring-teal-300/10 p-2 sm:p-6 space-y-3 sm:space-y-4 no-blur-children">
            <KeepAliveAccordion title="Running — Ruta libre" defaultOpen>
              <div data-flat="true" className="relative rounded-xl border border-cyan-300/40 bg-white/5 p-2 sm:p-3 overflow-hidden">
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <HUD label="Distancia" value={hud.distance_km.toFixed(2) + ' km'} />
                  <HUD label="Tiempo" value={fmtTime(hud.duration_s)} />
                  <HUD label="Ritmo" value={fmtPace(hud.pace_min_km, hud.distance_km)} />
                  <HUD label="Calorías" value={Math.round(hud.kcal)} />
                  <HUD label="Pulso actual" value={pulsoActual ? pulsoActual + ' bpm' : '—'} />
                  <HUD label="Pulso promedio" value={hrAvg ? hrAvg + ' bpm' : '—'} />
                  {extra.cad_rpm != null && <HUD label="Cadencia" value={`${extra.cad_rpm} rpm`} />}
                  {extra.power_w != null && <HUD label="Potencia" value={`${extra.power_w} W`} />}
                  {extra.resistance != null && <HUD label="Resistencia" value={`${extra.resistance}`} />}
                  {extra.incline_pct != null && <HUD label="Inclinación" value={`${extra.incline_pct}%`} />}
                  {extra.battery_pct != null && <HUD label="Batería" value={`${extra.battery_pct}%`} />}
                </div>
                <div className="mt-3 grid grid-cols-2 sm:flex gap-2 sm:gap-3 justify-center">
                  <Btn variant="start" onClick={start}>
                    Iniciar
                  </Btn>
                  <Btn variant="pause" onClick={pause} disabled={!isTracking || isPaused}>
                    Pausa
                  </Btn>
                  <Btn variant="start" onClick={resume} disabled={!isTracking || !isPaused}>
                    Continuar
                  </Btn>
                  <Btn variant="stop" onClick={stop} disabled={!isTracking}>
                    Terminar
                  </Btn>
                </div>
              </div>
            </KeepAliveAccordion>
            {(!center) && (
              <div className="text-center py-4">
                {locLoading ? (
                  <div className="text-white/80">Obteniendo tu ubicación…</div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-red-400">{locError || 'No se pudo obtener tu ubicación.'}</div>
                    <button onClick={requestCenter} className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">Reintentar</button>
                  </div>
                )}
              </div>
            )}
            {center && (
              <div
                data-map-glass
                id="native-map-host"
                className="map-wrapper native-map-host mt-3 relative isolate z-0 rounded-xl overflow-hidden bg-transparent !backdrop-blur-0 before:content-none after:content-none h-[200px] xs:h-[260px] sm:h-[320px]"
                style={{ WebkitBackdropFilter: 'none', backdropFilter: 'none' }}
              >
                <MapView className="w-full h-full" initialCenter={center} />
              </div>
            )}
            <GymBlePanel />

            {/* Música integrada: Spotify y Apple Music (pendiente de conexión) */}
            <div className="mt-4 flex items-center justify-center gap-8">
              <button
                type="button"
                className="h-20 w-20 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 shadow-[0_0_18px_rgba(0,0,0,.25)] overflow-hidden flex items-center justify-center"
                title="Conectar Spotify"
              >
                <img src="/branding/spoty.png" alt="Spotify" className="h-10 w-10 object-contain" />
              </button>
              <button
                type="button"
                className="h-20 w-20 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 shadow-[0_0_18px_rgba(0,0,0,.25)] overflow-hidden flex items-center justify-center"
                title="Conectar Apple Music"
              >
                <img src="/branding/apple.png" alt="Apple Music" className="h-10 w-10 object-contain" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// HUD y Btn reutilizables fuera del componente principal
function HUD({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1626]/70 backdrop-blur text-white tabular-nums tracking-wide px-3 py-2 nasa-blue-glow animate-nasa-blue-glow">
      <div className="text-xs text-white/70 flex items-center gap-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Btn({ children, variant, ...props }) {
  const styles = {
    start: 'bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,.45)]',
    pause: 'bg-amber-300 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,.4)]',
    stop: 'bg-rose-400 text-slate-900 shadow-[0_0_20px_rgba(244,63,94,.45)]',
  }[variant];
  return (
    <button
      type="button"
      className={`px-4 py-2 rounded-xl border border-white/10 hover:brightness-110 active:brightness-95 transition ${styles}`}
      {...props}
    >
      {children}
    </button>
  );
}
