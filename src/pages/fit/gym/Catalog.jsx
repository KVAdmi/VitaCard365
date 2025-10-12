import React, { useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { useEjerciciosCatalog } from '@/hooks/useEjerciciosCatalog';

// Combos con estilo cristal/neón para reemplazar <select>
function NeonSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value) || null;
  return (
    <div className="relative">
      <button type="button" onClick={()=>setOpen(v=>!v)}
        className={`w-full px-3 py-2 rounded-xl bg-violet-400/10 border border-violet-300/25 text-white text-left flex items-center justify-between transition-all ${open?'shadow-[0_0_24px_rgba(180,80,255,0.25)]':''}`}
        style={{ boxShadow: '0 0 0 1px rgba(179,136,255,0.28)' }}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span className={`ml-2 transition-transform ${open?'rotate-180':''}`}>⌄</span>
      </button>
      {open && (
        <ul className="absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-2xl border border-violet-300/30 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(60,0,120,0.35)]">
          {options.map(opt => (
            <li key={opt.value}>
              <button type="button" onClick={()=>{ onChange({ target: { value: opt.value } }); setOpen(false); }}
                className={`w-full text-left px-3 py-2 transition-colors hover:bg-violet-400/15 ${value===opt.value?'bg-violet-400/20 text-violet-100':''}`}
              >{opt.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GymCatalog() {
  const { data, loading, error, equipos, categorias, tipos } = useEjerciciosCatalog();
  const [q, setQ] = useState('');
  const [fEquipo, setFEquipo] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [openCats, setOpenCats] = useState({});

  const cap = (s) => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '';

  const list = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return (data || []).filter((e) => {
      if (qn) {
        const hay = [e.nombre, e.slug, e.categoria, e.tipo, ...(e.variantes || [])]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(qn));
        if (!hay) return false;
      }
      if (fEquipo && !e.equipo.map((x) => x.toLowerCase()).includes(fEquipo.toLowerCase())) return false;
      if (fCategoria && e.categoria !== fCategoria) return false;
      if (fTipo && e.tipo !== fTipo) return false;
      return true;
    });
  }, [data, q, fEquipo, fCategoria, fTipo]);

  const catsInList = useMemo(() => {
    const set = new Set((list || []).map((e) => e.categoria || 'Otros'));
    return Array.from(set);
  }, [list]);

  const toggleCat = (c) => setOpenCats((m) => ({ ...m, [c]: !m[c] }));

  return (
    <Layout title="Catálogo Gym" showBackButton>
      <div className="p-4 space-y-4">
        <style>{`
          @keyframes neonPulseViolet { 0%,100% { box-shadow: 0 0 0 1px rgba(179,136,255,0.38), 0 0 18px rgba(179,136,255,0.18);} 50% { box-shadow: 0 0 0 1px rgba(179,136,255,0.65), 0 0 26px rgba(179,136,255,0.32);} }
        `}</style>
        {/* Header con imagen de marca específica de Gym (más grande y visible) */}
        <div className="w-full flex items-center justify-center">
          <img src="/branding/Logo 2 Vita.png" alt="VitaCard 365" className="w-full max-w-[720px] sm:max-w-[840px] object-contain drop-shadow-[0_12px_48px_rgba(180,80,255,0.36)] mb-4" />
        </div>

        {/* Acciones del flujo Gym con estilo neón */}
        <div className="flex gap-3 justify-center">
          <Link to="/fit/gym/plan"
            className="px-4 py-2 rounded-2xl border border-violet-300/30 bg-violet-400/15 text-violet-100/95 hover:bg-violet-400/25 transition-all"
            style={{ animation: 'neonPulseViolet 2.4s ease-in-out infinite' }}>Ver plan</Link>
          <Link to="/fit/gym/progreso"
            className="px-4 py-2 rounded-2xl border border-violet-300/30 bg-violet-400/15 text-violet-100/95 hover:bg-violet-400/25 transition-all"
            style={{ animation: 'neonPulseViolet 2.4s ease-in-out infinite', animationDelay: '0.6s' }}>Ver progreso</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar ejercicio o variante"
                 className="px-3 py-2 rounded-xl bg-violet-400/10 border border-violet-300/25 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/70 transition-all" />
          <div className="grid grid-cols-3 gap-2">
            <NeonSelect value={fEquipo} onChange={(e)=>setFEquipo(e.target.value)} placeholder="Equipo"
              options={[{value:'',label:'Equipo'}, ...equipos.map(eq=>({value:eq,label:cap(eq)}))]} />
            <NeonSelect value={fCategoria} onChange={(e)=>setFCategoria(e.target.value)} placeholder="Categoría"
              options={[{value:'',label:'Categoría'}, ...categorias.map(c=>({value:c,label:cap(c)}))]} />
            <NeonSelect value={fTipo} onChange={(e)=>setFTipo(e.target.value)} placeholder="Tipo"
              options={[{value:'',label:'Tipo'}, ...tipos.map(t=>({value:t,label:cap(t)}))]} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/fit/gym/circuit" className="px-3 py-2 rounded-xl border border-violet-300/30 bg-violet-400/10 text-violet-100/95 hover:bg-violet-400/20 transition-colors">Armar circuito</Link>
          <Link to="/fit/gym/run" className="px-3 py-2 rounded-xl border border-violet-300/20 bg-white/5 text-white/90 hover:bg-violet-400/10">Runner</Link>
        </div>
        {loading && <div>Cargando catálogo…</div>}
        {error && <div className="text-red-300">{error}</div>}

        {/* Agrupar por categoría en tarjetas cristal con despliegue */}
        <div className="space-y-3">
          {catsInList.map((cat) => {
            const items = list.filter((e) => (e.categoria || 'Otros') === cat);
            const open = !!openCats[cat];
            return (
              <div key={cat} className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_40px_rgba(0,40,80,0.35)] overflow-hidden">
                <button onClick={()=>toggleCat(cat)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                  <div>
                    <div className="text-sm font-semibold text-white">{cap(cat)}</div>
                    <div className="text-xs opacity-70">{items.length} Ejercicios</div>
                  </div>
                  <div className={`transition-transform ${open ? 'rotate-180' : ''}`}>⌄</div>
                </button>
                {open && (
                  <ul className="divide-y divide-white/10">
                    {items.map((e) => (
                      <li key={e.id} className="p-3 hover:bg-white/5">
                        <div className="font-semibold text-white">{e.nombre}</div>
                        <div className="text-xs opacity-80">{[e.categoria, e.tipo].filter(Boolean).map(cap).join(' · ')}</div>
                        <div className="text-xs opacity-70 mt-1">Equipo: {(e.equipo && e.equipo.length) ? e.equipo.join(', ') : 'Ninguno'}</div>
                        {e.anatomia?.musculos_principales?.length ? (
                          <div className="text-xs opacity-70">Foco: {e.anatomia.musculos_principales.join(', ')}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {!loading && list.length === 0 && (
            <div className="p-3 text-sm opacity-80 rounded-xl border border-white/10 bg-white/5">Sin resultados</div>
          )}
        </div>
        {/* Footer con imagen del atleta */}
        <div className="w-full flex items-center justify-center pt-4 pb-8">
          <img src="/branding/14.png" alt="Gym" className="w-full max-w-xs sm:max-w-sm opacity-95" />
        </div>
      </div>
    </Layout>
  );
}
