import { useRef, useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export function useRunTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const watchId = useRef<string | null>(null);
  const points = useRef<{lat: number; lng: number; timestamp: number}[]>([]);
  const startTime = useRef<number | null>(null);
  const pauseTime = useRef<number | null>(null);
  const totalPausedTime = useRef<number>(0);

  const [stats, setStats] = useState({ distance_km: 0, duration_s: 0, pace_min_km: 0, kcal: 0 });

  // Mantener ref sincronizada para evitar closures con valores stale
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Calcular distancia entre dos puntos
  const calculateDistance = (p1: {lat: number; lng: number}, p2: {lat: number; lng: number}) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Actualizar estadísticas (siempre actualiza duración; distancia/pace solo si hay puntos)
  const updateStats = () => {
    if (!startTime.current) return;

    let totalDistance = 0;
    if (points.current.length >= 2) {
      for (let i = 1; i < points.current.length; i++) {
        const d = calculateDistance(points.current[i-1], points.current[i]);
        // descartar saltos menores a 1 metro para reducir ruido
        if (d > 0.001) totalDistance += d;
      }
    }

    const now = Date.now();
    const effectiveDuration = now - startTime.current - totalPausedTime.current;
    const durationInSeconds = Math.floor(effectiveDuration / 1000);
    const paceMinKm = totalDistance > 0 ? (durationInSeconds / 60) / totalDistance : 0;
    const kcal = Math.round(durationInSeconds * 0.16); // Estimación simple de calorías

    setStats(prev => ({
      distance_km: totalDistance,
      duration_s: durationInSeconds,
      pace_min_km: paceMinKm,
      kcal
    }));
  };

  // Iniciar tracking
  const start = async () => {
    try {
      // Solicitar permiso de ubicación
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        await Geolocation.requestPermissions();
      }

      // Iniciar tracking
      points.current = [];
      startTime.current = Date.now();
      totalPausedTime.current = 0;
      setIsTracking(true);
      setIsPaused(false);

      // Comenzar a observar la ubicación.
      // Intentamos primero el watch de Capacitor. Si falla (p.ej. 'Not implemented on web'), hacemos fallback
      // al API nativo del navegador (navigator.geolocation).
      try {
        const id = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }, (position, error) => {
          if (error) {
            console.error('[Tracking] Error de ubicación (Capacitor):', error);
            return;
          }
          if (!position) {
            console.error('[Tracking] No se recibió posición (Capacitor)');
            return;
          }
          if (!isPausedRef.current) {
            if (points.current.length === 0) {
              points.current.push({ lat: position.coords.latitude, lng: position.coords.longitude, timestamp: position.timestamp });
            }
            points.current.push({ lat: position.coords.latitude, lng: position.coords.longitude, timestamp: position.timestamp });
            updateStats();
          }
        });
        // watchPosition de Capacitor devuelve un id (a veces number/string)
        watchId.current = id != null ? id.toString() : null;
      } catch (err) {
        console.warn('[Tracking] Capacitor watchPosition falló, intentando navigator.geolocation', err);
        // Fallback para web browsers
        try {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            const navId = navigator.geolocation.watchPosition((position) => {
              if (!position || !position.coords) return;
              if (!isPausedRef.current) {
                if (points.current.length === 0) {
                  points.current.push({ lat: position.coords.latitude, lng: position.coords.longitude, timestamp: position.timestamp });
                }
                points.current.push({ lat: position.coords.latitude, lng: position.coords.longitude, timestamp: position.timestamp });
                updateStats();
              }
            }, (error) => {
              console.error('[Tracking] Error de ubicación (navigator):', error);
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
            // Marcamos la id con prefijo para distinguir en clear
            watchId.current = navId != null ? `nav-${navId}` : null;
          } else {
            console.error('[Tracking] Fallback navigator.geolocation no está disponible en este entorno');
          }
        } catch (e2) {
          console.error('[Tracking] Fallback navigator.geolocation falló:', e2);
        }
      }

    } catch (error) {
      console.error('Error al iniciar tracking:', error);
    }
  };

  // Pausar tracking
  const pause = () => {
    if (isTracking && !isPaused) {
      setIsPaused(true);
      isPausedRef.current = true;
      pauseTime.current = Date.now();
    }
  };

  // Continuar tracking
  const resume = () => {
    if (isTracking && isPaused && pauseTime.current) {
      setIsPaused(false);
      isPausedRef.current = false;
      totalPausedTime.current += Date.now() - pauseTime.current;
      pauseTime.current = null;
    }
  };

  // Terminar tracking
  const stop = async () => {
    if (watchId.current) {
      try {
        if (typeof watchId.current === 'string' && watchId.current.startsWith('nav-')) {
          const raw = Number(watchId.current.replace('nav-', ''));
          try { if (typeof navigator !== 'undefined' && navigator.geolocation) navigator.geolocation.clearWatch(raw); } catch {}
        } else {
          try { await Geolocation.clearWatch({ id: watchId.current }); } catch {}
        }
      } catch (e) { /* ignore */ }
      watchId.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
    isPausedRef.current = false;
    startTime.current = null;
    pauseTime.current = null;
    // No limpiamos points.current para mantener la última ruta
  };

  // Actualizar stats periódicamente mientras se trackea (asegura que duration avance en stats)
  useEffect(() => {
    let id: any = null;
    if (isTracking && !isPaused) {
      id = setInterval(() => updateStats(), 1000);
    }
    return () => { if (id) clearInterval(id); };
  }, [isTracking, isPaused]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchId.current) {
        try { Geolocation.clearWatch({ id: watchId.current }); } catch {}
      }
    };
  }, []);

  return {
    start,
    pause,
    resume,
    stop,
    isTracking,
    isPaused,
    stats,
    currentPoints: points.current
  };
}