import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

function useLocalDraft() {
  const [draft, setDraft] = useState(() => {
    try { const v = localStorage.getItem('vc.gym.circuit.draft'); return v ? JSON.parse(v) : { name: 'Mi circuito', items: [] }; } catch { return { name: 'Mi circuito', items: [] }; }
  });
  return { draft, setDraft };
}

export default function Runner() {
  const { draft } = useLocalDraft();
  const [idx, setIdx] = useState(0);
  const [serie, setSerie] = useState(1);
  const [rest, setRest] = useState(0);
  const timerRef = useRef(null);

  const current = draft.items[idx];
  const total = draft.items.length;
  const seriesTot = current?.series || 0;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startRest = () => {
    const secs = Number(current?.descanso || 60);
    setRest(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRest((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const next = () => {
    if (!current) return;
    if (serie < seriesTot) {
      setSerie(serie + 1);
      startRest();
    } else {
      // siguiente ejercicio
      setSerie(1);
      setIdx((i) => Math.min(i + 1, total));
      if (timerRef.current) clearInterval(timerRef.current);
      setRest(0);
    }
  };

  if (!total) {
    return (
      <Layout title="Runner Gym" showBackButton>
        <div className="p-4 space-y-3">
          <div className="text-sm opacity-80">No hay circuito cargado.</div>
          <Link to="/fit/gym/circuit" className="px-3 py-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100/90">Armar circuito</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={draft.name || 'Runner Gym'} showBackButton>
      <div className="p-6 space-y-6">
        <div className="text-sm opacity-80">Ejercicio {idx + 1} / {total}</div>
        <div className="rounded-2xl p-5 border border-cyan-300/20 bg-white/5">
          <div className="text-xl font-bold text-white">{current.nombre}</div>
          <div className="opacity-80">{current.categoria} · {current.tipo}</div>
          <div className="mt-2 text-sm">Serie {serie}/{seriesTot} · Reps/tiempo: {current.reps} · Descanso: {current.descanso}s</div>
          {rest > 0 && (
            <div className="mt-3 text-2xl font-mono text-emerald-300">Descanso: {rest}s</div>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={next} className="px-3 py-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-100/90">{serie < seriesTot ? 'Siguiente serie' : 'Siguiente ejercicio'}</button>
            <Link to="/fit/gym/circuit" className="px-3 py-2 rounded-xl border border-white/15 bg-white/5">Editar circuito</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
