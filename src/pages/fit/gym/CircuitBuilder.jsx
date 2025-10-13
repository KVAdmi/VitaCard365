import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { useEjerciciosCatalog } from '@/hooks/useEjerciciosCatalog';
import { Link } from 'react-router-dom';
import { listMyCircuits, listPublicCircuits, createCircuit, updateCircuit, getCircuitWithItems, replaceCircuitItems } from '@/lib/gymApi';
import { supabase } from '@/lib/supabaseClient';

function useLocalStorageState(key, initial) {
  const [state, setState] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

export default function CircuitBuilder() {
  const { data, loading } = useEjerciciosCatalog();
  const [draft, setDraft] = useLocalStorageState('vc.gym.circuit.draft', { id: null, owner_id: null, name: 'Mi circuito', items: [] });
  const [mine, setMine] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return (data || []).filter(e => !qn || e.nombre.toLowerCase().includes(qn) || (e.variantes||[]).some(v=>v.toLowerCase().includes(qn)));
  }, [data, q]);

  const add = (e) => {
    setDraft((d) => ({ ...d, items: [...d.items, { id: e.id, nombre: e.nombre, tipo: e.tipo, categoria: e.categoria, reps: 10, series: 3, descanso: 60 }] }));
  };
  const update = (idx, patch) => {
    setDraft((d) => ({ ...d, items: d.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }));
  };
  const remove = (idx) => setDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));

  useEffect(() => {
    (async () => {
      try {
        const [m, t] = await Promise.all([listMyCircuits(), listPublicCircuits()]);
        setMine(m);
        setTemplates(t);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const loadCircuit = async (id) => {
    try {
      setBusy(true);
      const { circuit, items } = await getCircuitWithItems(id);
      const mapped = (items || []).map((it) => ({
        id: it.ejercicio_id,
        nombre: (data || []).find(x => x.id === it.ejercicio_id)?.nombre || it.ejercicio_id,
        reps: it.reps ?? 10,
        series: it.series ?? 3,
        descanso: it.descanso_seg ?? 60,
      }));
  setDraft({ id: circuit?.id || null, owner_id: circuit?.user_id || null, name: circuit?.name || 'Mi circuito', items: mapped });
    } catch (e) {
      alert('No se pudo cargar el circuito');
    } finally { setBusy(false); }
  };

  const saveCircuit = async () => {
    try {
      if (!draft.name?.trim()) { alert('Ponle nombre a tu circuito'); return; }
      if (!draft.items.length) { alert('Agrega al menos un ejercicio'); return; }
      // Validar sesión
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) { alert('Inicia sesión para guardar tu circuito.'); return; }
      setBusy(true);
      let id = draft.id;
      const isOwned = !!draft.owner_id && draft.owner_id === uid;
      if (!id || !isOwned) {
        const c = await createCircuit(draft.name, null, null);
        id = c.id;
      } else {
        await updateCircuit(id, { name: draft.name });
      }
      await replaceCircuitItems(id, draft.items.map((it, idx) => ({
        orden: idx + 1,
        ejercicio_id: it.id,
        series: Number(it.series) || 3,
        reps: Number(it.reps) || null,
        tiempo_seg: null,
        descanso_seg: Number(it.descanso) || 60,
      })));
      setDraft((d) => ({ ...d, id, owner_id: uid }));
      // Guardar parámetros de plan (estimación de minutos por sesión) para Progreso (Gym)
      try {
        const totalSeg = (draft.items || []).reduce((acc, it) => {
          const reps = Number(it.reps) || 0;
          const series = Number(it.series) || 1;
          const descanso = Number(it.descanso) || 60;
          return acc + series * ((reps * 3) + descanso);
        }, 0);
        const minutos = Math.max(15, Math.round(totalSeg / 60));
        const prev = JSON.parse(localStorage.getItem('vc.gym.params') || 'null');
        const diasSemana = Number(prev?.diasSemana) || 4;
        localStorage.setItem('vc.gym.params', JSON.stringify({ diasSemana, minutos }));
      } catch {}
      const m = await listMyCircuits();
      setMine(m);
      alert('Circuito guardado');
    } catch (e) {
      console.error(e);
      const msg = (e && (e.message || e.error_description)) ? e.message || e.error_description : 'No se pudo guardar el circuito';
      alert(msg);
    } finally { setBusy(false); }
  };

  return (
    <Layout title="Armar circuito (Gym)" showBackButton>
      <div className="p-4 space-y-4 max-w-full relative">
        <style>{`
          @keyframes neonPulseViolet { 0%,100% { box-shadow: 0 0 0 1px rgba(179,136,255,0.38), 0 0 18px rgba(179,136,255,0.18);} 50% { box-shadow: 0 0 0 1px rgba(179,136,255,0.65), 0 0 26px rgba(179,136,255,0.32);} }
        `}</style>
        {/* Header con logo centrado y aro neón sutil */}
        <div className="w-full flex items-center justify-center mb-6 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl border border-violet-300/25" style={{boxShadow:'0 0 24px rgba(180,80,255,0.25)'}}></div>
            <img src="/branding/Logo 2 Vita.png" alt="VitaCard 365" className="w-[300px] sm:w-[420px] object-contain drop-shadow-[0_16px_56px_rgba(180,80,255,0.40)]" />
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-2 mb-4 flex-wrap">
          <Link to="/fit/gym/plan" className="px-4 py-2 rounded-2xl border border-violet-300/30 bg-violet-400/15 text-violet-100/95 hover:bg-violet-400/25 transition-all" style={{ animation: 'neonPulseViolet 2.4s ease-in-out infinite' }}>Ver plan</Link>
          <Link to="/fit/gym/progreso" className="px-4 py-2 rounded-2xl border border-violet-300/30 bg-violet-400/15 text-violet-100/95 hover:bg-violet-400/25 transition-all" style={{ animation: 'neonPulseViolet 2.4s ease-in-out infinite', animationDelay: '0.6s' }}>Ver progreso</Link>
        </div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input value={draft.name} onChange={(e)=>setDraft(d=>({ ...d, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-violet-300/25 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/70 transition-all" />
            <div className="rounded-xl border border-white/10 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-2">Ejercicio</th>
                    <th className="p-2">Series</th>
                    <th className="p-2">Reps/Tiempo</th>
                    <th className="p-2">Descanso</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((it, idx) => (
                    <tr key={idx} className="border-t border-white/10">
                      <td className="p-2 max-w-[50vw] sm:max-w-none">
                        <div className="truncate">{it.nombre}</div>
                      </td>
                      <td className="p-2"><input type="number" min={1} value={it.series} onChange={(e)=>update(idx,{ series: Number(e.target.value) })} className="w-20 px-3 py-1 rounded bg-white/10 border border-violet-300/25 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/70 transition-all"/></td>
                      <td className="p-2"><input type="number" min={1} value={it.reps} onChange={(e)=>update(idx,{ reps: Number(e.target.value) })} className="w-24 px-3 py-1 rounded bg-white/10 border border-violet-300/25 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/70 transition-all"/></td>
                      <td className="p-2"><input type="number" min={10} step={5} value={it.descanso} onChange={(e)=>update(idx,{ descanso: Number(e.target.value) })} className="w-24 px-3 py-1 rounded bg-white/10 border border-violet-300/25 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/70 transition-all"/></td>
                      <td className="p-2 text-right"><button onClick={()=>remove(idx)} className="px-2 py-1 text-xs rounded bg-red-500/20 border border-red-500/30">Quitar</button></td>
                    </tr>
                  ))}
                  {draft.items.length === 0 && (
                    <tr><td colSpan={5} className="p-3 text-sm opacity-75">Aún no has agregado ejercicios</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button onClick={saveCircuit} disabled={busy} className="px-3 py-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-100/90">Guardar</button>
              {draft.items.length > 0 && (
                <Link to="/fit/gym/run" className="px-3 py-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100/90">Iniciar</Link>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar en catálogo" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-violet-300/25 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/70 transition-all" />
            {loading ? <div>Cargando catálogo…</div> : (
              <ul className="max-h-[60vh] overflow-auto divide-y divide-white/10 rounded-xl border border-white/10">
                {list.map((e) => (
                  <li key={e.id} className="p-3 flex items-center justify-between hover:bg-white/5">
                    <div>
                      <div className="font-semibold text-white">{e.nombre}</div>
                      <div className="text-xs opacity-70">{[e.categoria, e.tipo].filter(Boolean).join(' · ')}</div>
                    </div>
                    <button onClick={()=>add(e)} className="px-2 py-1 text-xs rounded bg-emerald-500/20 border border-emerald-500/30">Agregar</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-semibold text-white mb-2">Mis circuitos</div>
                <ul className="max-h-[30vh] overflow-auto divide-y divide-white/10 rounded-xl border border-white/10">
                  {mine.map((c) => (
                    <li key={c.id} className="p-3 flex items-center justify-between hover:bg-white/5">
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-xs opacity-70">Actualizado: {new Date(c.updated_at).toLocaleString()}</div>
                      </div>
                      <button onClick={()=>loadCircuit(c.id)} disabled={busy} className="px-2 py-1 text-xs rounded bg-cyan-500/20 border border-cyan-500/30">Cargar</button>
                    </li>
                  ))}
                  {!mine.length && <li className="p-3 text-sm opacity-75">Sin circuitos</li>}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-2">Plantillas públicas</div>
                <ul className="max-h-[30vh] overflow-auto divide-y divide-white/10 rounded-xl border border-white/10">
                  {templates.map((c) => (
                    <li key={c.id} className="p-3 flex items-center justify-between hover:bg-white/5">
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-xs opacity-70">Plantilla</div>
                      </div>
                      <button onClick={()=>loadCircuit(c.id)} disabled={busy} className="px-2 py-1 text-xs rounded bg-cyan-500/20 border border-cyan-500/30">Cargar</button>
                    </li>
                  ))}
                  {!templates.length && <li className="p-3 text-sm opacity-75">Sin plantillas</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer sin foto de modelo */}
      <div className="h-6" />
    </Layout>
  );
}
