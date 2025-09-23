

import React, { useEffect, useRef } from "react";
import { Capacitor } from '@capacitor/core';

import { startRun, pushPoint, stopRun } from "@/services/fitApi";

import { loadMaps } from "../../utils/loadMaps";
const toRad = d => d*Math.PI/180;
function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

export default function RunSyncMap({ apiRef, onHud }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const polyRef = React.useRef(null);
  const watchIdRef = React.useRef(null);
  const stateRef = React.useRef({
    runId: null, running: false, paused: false,
    startedAt: null, lastPoint: null, distanceM: 0, tickTimer: null
  });

  const emitHud = () => {
    const s = stateRef.current;
    const durationS = s.startedAt ? Math.floor((Date.now() - s.startedAt)/1000) : 0;
    const km = s.distanceM/1000;
    const paceMinKm = km > 0 ? (durationS/60)/km : 0;
    const kcal = Math.round(durationS * 0.16);
    onHud?.({ distance_km: km, duration_s: durationS, pace_min_km: paceMinKm, kcal });
  };

  React.useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      resize: () => {
        if (mapRef.current) window.google?.maps?.event.trigger(mapRef.current, "resize");
      },
      start: async (user_id, opts = {}) => {
        if (stateRef.current.running) return;
        const { run_id } = await startRun({ user_id, source: "manual", type: "running", ...opts });
        stateRef.current = { ...stateRef.current, runId: run_id, running: true, paused: false, startedAt: Date.now(), distanceM: 0, lastPoint: null };
        stateRef.current.tickTimer = setInterval(emitHud, 1000);
        emitHud();
      },
      pause: () => {
        const s = stateRef.current;
        if (!s.running || s.paused) return;
        s.paused = true;
        if (s.tickTimer) {
          clearInterval(s.tickTimer);
          s.tickTimer = null;
        }
        // Guardar el tiempo transcurrido hasta la pausa
        s.pausedAt = Date.now();
        s.elapsedBeforePause = s.startedAt ? (s.pausedAt - s.startedAt) : 0;
      },
      resume: () => {
        const s = stateRef.current;
        if (!s.running || !s.paused) return;
        // Al reanudar, ajustar startedAt para que el tiempo siga sumando correctamente
        const now = Date.now();
        if (s.elapsedBeforePause) {
          s.startedAt = now - s.elapsedBeforePause;
        }
        s.paused = false;
        delete s.pausedAt;
        delete s.elapsedBeforePause;
        if (!s.tickTimer) {
          s.tickTimer = setInterval(emitHud, 1000);
        }
      },
      stop: async () => {
        const s = stateRef.current;
        if (!s.runId) return;
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        if (s.tickTimer) clearInterval(s.tickTimer);
        const summary = await stopRun(s.runId);
        onHud?.(summary);
        stateRef.current = { runId: null, running: false, paused: false, startedAt: null, lastPoint: null, distanceM: 0, tickTimer: null };
      }
    };
  }, [apiRef]);


  React.useEffect(() => {
    // Selecciona la key según plataforma
    const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
    const key = isNative
      ? import.meta.env.VITE_MAPS_APP_KEY || import.meta.env.VITE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY
      : import.meta.env.VITE_MAPS_WEB_KEY || import.meta.env.VITE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY;
    let cancelled = false;

  loadMaps().then(() => {
      if (cancelled) return;
      const g = window.google.maps;
      mapRef.current = new g.Map(containerRef.current, {
        center: { lat: 20.6736, lng: -103.344 }, zoom: 15,
        disableDefaultUI: true, clickableIcons: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0b1626' }]},
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1626' }]},
          { elementType: 'labels.text.fill', stylers: [{ color: '#9bdfe0' }]},
          { featureType: 'poi', stylers: [{ visibility: 'off' }]},
          { featureType: 'road', stylers: [{ color: '#1b2a44' }]},
          { featureType: 'water', stylers: [{ color: '#10365a' }]},
          { featureType: 'transit', stylers: [{ visibility: 'off' }]},
        ]
      });
      markerRef.current = new g.Marker({ position: mapRef.current.getCenter(), map: mapRef.current });
      polyRef.current = new g.Polyline({ map: mapRef.current, path: [], geodesic: true, strokeColor: "#5CE9E1", strokeWeight: 5, strokeOpacity: 0.95 });

      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy, speed } = pos.coords;
            const p = { lat: latitude, lng: longitude };
            markerRef.current?.setPosition(p);
            const s = stateRef.current;
            const path = polyRef.current.getPath();
            if (path.getLength() === 0) mapRef.current?.setCenter(p);

            if (s.running && !s.paused) {
              path.push(p);
              if (s.lastPoint) s.distanceM += haversine(s.lastPoint, p);
              s.lastPoint = p;
              emitHud();
              if (s.runId) {
                pushPoint(s.runId, { lat: p.lat, lng: p.lng, ts: new Date(pos.timestamp).toISOString(), accuracy, speed })
                  .catch(console.warn);
              }
            }
          },
          (err) => console.warn("Geolocation error:", err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      }
    });

    return () => {
      cancelled = true;
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (stateRef.current.tickTimer) clearInterval(stateRef.current.tickTimer);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden" />;
}
