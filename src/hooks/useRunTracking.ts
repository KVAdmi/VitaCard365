import { useRef, useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export function useRunTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const watchId = useRef<string | null>(null);
  const points = useRef<{lat: number; lng: number; timestamp: number}[]>([]);
  const startTime = useRef<number | null>(null);
  const pauseTime = useRef<number | null>(null);
  const totalPausedTime = useRef<number>(0);

  const [stats, setStats] = useState({
    distance_km: 0,
    duration_s: 0,
    pace_min_km: 0,
    kcal: 0
  });

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

  // Actualizar estadísticas
  const updateStats = () => {
    if (!startTime.current || points.current.length < 2) return;

    let totalDistance = 0;
    for (let i = 1; i < points.current.length; i++) {
      totalDistance += calculateDistance(points.current[i-1], points.current[i]);
    }

    const now = Date.now();
    const effectiveDuration = now - startTime.current - totalPausedTime.current;
    const durationInSeconds = Math.floor(effectiveDuration / 1000);
    const paceMinKm = totalDistance > 0 ? (durationInSeconds / 60) / totalDistance : 0;
    const kcal = Math.round(durationInSeconds * 0.16); // Estimación simple de calorías

    setStats({
      distance_km: totalDistance,
      duration_s: durationInSeconds,
      pace_min_km: paceMinKm,
      kcal
    });
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

      // Comenzar a observar la ubicación
      watchId.current = (await Geolocation.watchPosition({
        enableHighAccuracy: true,
  timeout: 5000, // 5 segundos máximo para obtener posición, pero depende del hardware
  maximumAge: 0
      }, (position, error) => {
        if (error) {
          console.error('[Tracking] Error de ubicación:', error);
          return;
        }
        if (!position) {
          console.error('[Tracking] No se recibió posición');
          return;
        }
        if (!isPaused) {
          points.current.push({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: position.timestamp
          });
          updateStats();
        }
      })).toString();

    } catch (error) {
      console.error('Error al iniciar tracking:', error);
    }
  };

  // Pausar tracking
  const pause = () => {
    if (isTracking && !isPaused) {
      setIsPaused(true);
      pauseTime.current = Date.now();
    }
  };

  // Continuar tracking
  const resume = () => {
    if (isTracking && isPaused && pauseTime.current) {
      setIsPaused(false);
      totalPausedTime.current += Date.now() - pauseTime.current;
      pauseTime.current = null;
    }
  };

  // Terminar tracking
  const stop = async () => {
    if (watchId.current) {
      await Geolocation.clearWatch({ id: watchId.current });
      watchId.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
    startTime.current = null;
    pauseTime.current = null;
    // No limpiamos points.current para mantener la última ruta
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchId.current) {
        Geolocation.clearWatch({ id: watchId.current });
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