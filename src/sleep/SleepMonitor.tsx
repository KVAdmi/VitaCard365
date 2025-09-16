import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { getActive, setActive, saveSleep } from './storage';

export default function SleepMonitor({ onSaved }:{ onSaved?:()=>void }) {
  const [running, setRunning] = useState<boolean>(!!getActive());
  const [startTs, setStartTs] = useState<number>(getActive() || 0);
  const [elapsed, setElapsed] = useState<number>(0); // ms
  const wakeLockRef = useRef<any>(null);
  const tickRef = useRef<any>(null);

  const fmt = (ms:number) => {
    const s = Math.floor(ms/1000);
    const hh = String(Math.floor(s/3600)).padStart(2,'0');
    const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  };

  async function requestWakeLock() {
    try {
      // No falla si el browser no lo soporta
      // @ts-ignore
      wakeLockRef.current = await navigator.wakeLock?.request('screen');
    } catch {}
  }

  const start = async () => {
    const ts = Date.now();
    setStartTs(ts);
    setActive(ts);
    setRunning(true);
    await requestWakeLock();
  };

  const stop = () => {
    const end = Date.now();
    const durationMin = Math.max(1, Math.round((end - startTs)/60000));
    saveSleep({
      id: uuid(),
      source: 'manual',
      startTs,
      endTs: end,
      durationMin
    });
    setActive(null);
    setRunning(false);
    setElapsed(0);
    // @ts-ignore
    wakeLockRef.current?.release?.();
    onSaved?.();
  };

  useEffect(() => {
    function loop() {
      setElapsed(Date.now() - startTs);
      tickRef.current = requestAnimationFrame(loop);
    }
    if (running && startTs) tickRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(tickRef.current);
  }, [running, startTs]);

  useEffect(() => {
    const vis = () => {
      // reintenta wake lock al volver
      if (document.visibilityState === 'visible' && running) requestWakeLock();
    };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [running]);

  return (
    <div className="card p-6">
      <div className="text-center text-5xl font-bold tabular-nums">{fmt(running ? elapsed : 0)}</div>
      <p className="text-center opacity-80 mt-2">{running ? 'Monitoreando…' : 'Listo para iniciar el monitoreo'}</p>
      <div className="mt-6">
        {!running ? (
          <button className="btn btn-primary w-full" onClick={start}>▶ Iniciar Monitoreo</button>
        ) : (
          <button className="btn btn-error w-full" onClick={stop}>■ Detener y Guardar</button>
        )}
      </div>
      <p className="mt-3 text-xs opacity-70">
        Los datos se procesan en tu dispositivo. Cierra esta pestaña y el cronómetro se detendrá (limitación de navegador).
      </p>
    </div>
  );