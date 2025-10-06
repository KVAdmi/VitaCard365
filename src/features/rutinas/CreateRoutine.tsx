// src/features/rutinas/CreateRoutine.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buscarEjercicios, CategoriaEjercicio,
  crearPlan, crearRutinaDia, agregarEjerciciosARutina,
  getUserId, FocoDia, RutinaItemInput
} from './api';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/useToast';
import ReminderPanel from '@/features/rutinas/ReminderPanel';
import Modal from '@/components/Modal';
import { ensureAccess } from '@/lib/access';

// ----- UI helpers (respetan tu tema por variables CSS) -----
// Marco neón uniforme (mismo look & feel que las tiles de Fitness)
const Card: React.FC<React.PropsWithChildren<{className?: string, hoverable?: boolean}>> = ({ className='', hoverable=false, children }) => (
  <div
    className={`group relative rounded-2xl border border-cyan-400/20 bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(0,40,80,0.45)] ${hoverable ? 'transition-all duration-200 hover:bg-cyan-400/10 hover:shadow-[0_0_32px_4px_rgba(0,255,255,0.18)]' : ''} ${className}`}
    style={{ boxShadow: '0 0 0 1.5px #00ffe7, 0 20px 40px rgba(0,40,80,0.35)' }}
  >
    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 group-hover:border-cyan-300/30 transition-all" />
    <div className="relative z-10">
      {children}
    </div>
  </div>
);
const SectionTitle: React.FC<{label: string, hint?: string}> = ({ label, hint }) => (
  <div className="flex items-end justify-between mb-2">
    <h3 className="text-lg font-semibold">{label}</h3>
    {hint ? <span className="text-xs opacity-70">{hint}</span> : null}
  </div>
);

// ----- Constants / tipos -----
type Paso = 'objetivo' | 'estructura' | 'dias' | 'ejercicios' | 'resumen';
const focos: FocoDia[] = ['full','upper','lower','movilidad','cardio','core'];
const focoLabel: Record<FocoDia, string> = {
  full: 'completo',
  upper: 'superior',
  lower: 'inferior',
  movilidad: 'movilidad',
  cardio: 'cardio',
  core: 'core',
};
const categorias: CategoriaEjercicio[] = ['empuje','tiron','rodilla','cadera','core','movilidad','cardio'];

export default function CreateRoutine() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [paso, setPaso] = useState<Paso>('objetivo');

  // Paso 1
  const [objetivo, setObjetivo] = useState<'musculo'|'grasa'|'movilidad'|'cardio'|'mixto'>('musculo');
  const [semanas, setSemanas] = useState(4);
  const [diasSemana, setDiasSemana] = useState(4);
  const [minutos, setMinutos] = useState<number>(25); // int libre; UI MVP 15/25/40

  // Paso 2
  const [focoPorDia, setFocoPorDia] = useState<Record<number, FocoDia>>({ 1:'upper', 2:'lower', 3:'full', 4:'movilidad' });

  // Paso 3
  const [diaActivo, setDiaActivo] = useState(1);
  const [itemsPorDia, setItemsPorDia] = useState<Record<number, RutinaItemInput[]>>({});

  // Buscador + filtros
  const [query, setQuery] = useState('');
  const [catFiltro, setCatFiltro] = useState<CategoriaEjercicio | 'todas'>('todas');
  const [equipoFiltro, setEquipoFiltro] = useState<string>('');
  const [nivelFiltro, setNivelFiltro] = useState<0|1|2|3|undefined>(undefined);
  const [resultados, setResultados] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(()=>{
    const f = focoPorDia[diaActivo];
    if (f==='upper') setCatFiltro('empuje');
    else if (f==='lower') setCatFiltro('rodilla');
    else if (f==='movilidad') setCatFiltro('movilidad');
    else if (f==='cardio') setCatFiltro('cardio');
    else if (f==='core') setCatFiltro('core');
    else setCatFiltro('todas');
  }, [diaActivo, focoPorDia]);

  async function search() {
    setLoadingSearch(true);
    try {
      const res = await buscarEjercicios({
        q: query,
        categoria: catFiltro,
        equipoIncluye: equipoFiltro || undefined,
        nivelMax: typeof nivelFiltro === 'number' ? nivelFiltro : undefined,
        limit: 50
      });
      setResultados(res);
    } finally {
      setLoadingSearch(false);
    }
  }

  function pushItem(dia: number, exId: string, preset?: Partial<RutinaItemInput>) {
    const base: RutinaItemInput = { ejercicio_id: exId, series: 3, reps: 10, descanso_seg: 60, rpe: 7 };
    setItemsPorDia(prev => ({ ...prev, [dia]: [ ...(prev[dia] ?? []), { ...base, ...preset } ] }));
  }
  function removeItem(dia: number, idx: number) {
    setItemsPorDia(prev => {
      const arr = [...(prev[dia] ?? [])]; arr.splice(idx,1);
      return { ...prev, [dia]: arr };
    });
  }

  const puedeContinuarObjetivo = semanas>=1 && semanas<=24 && diasSemana>=2 && diasSemana<=7;
  const dias = useMemo(() => Array.from({length: diasSemana}, (_,i)=>i+1), [diasSemana]);

  // Guardado
  const [saving, setSaving] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [defaultReminderDays, setDefaultReminderDays] = useState<number[]>([]);
  const [defaultReminderTime, setDefaultReminderTime] = useState('07:00');

  // Sugerir días según días/semana (1=Dom..7=Sáb)
  function suggestDays(n: number): number[] {
    const Su=1,M=2,T=3,W=4,Th=5,F=6,Sa=7;
    switch (n) {
      case 2:  return [M, Th];
      case 3:  return [M, W, F];
      case 4:  return [M, T, Th, Sa];
      case 5:  return [M, T, W, Th, F];
      case 6:  return [M, T, W, Th, F, Sa];
      case 7:  return [Su, M, T, W, Th, F, Sa];
      default: return [M, W];
    }
  }

  async function guardarTodo() {
    setSaving(true);
    try {
      const user_id = await getUserId();
      // Verificación de acceso (membresía) antes de guardar
      const { allowed } = await ensureAccess();
      if (!allowed) {
        toastError('Tu acceso no está activo. Completa el pago para continuar.');
        setSaving(false);
        navigate('/pago'); // ajusta a tu ruta real de pasarela
        return;
      }
      if (!user_id) {
        // Si trabajas sin login no podrás pasar RLS en producción.
        toastError('No hay sesión activa; inicia sesión para asociar tu plan a tu cuenta.');
        setSaving(false);
        navigate('/login');
        return;
      }

      // Guard simple: si hay días sin ejercicios, confirmamos
      const diasSinItems = dias.filter(d => (itemsPorDia[d]?.length ?? 0) === 0);
      if (diasSinItems.length > 0) {
        const confirmar = window.confirm(`Tienes ${diasSinItems.length} día(s) sin ejercicios. ¿Deseas guardar de todas formas?`);
        if (!confirmar) { setSaving(false); return; }
      }

      // Plan
      const plan_id = await crearPlan({
        user_id: user_id as any,
        objetivo,
        semanas,
        dias_semana: diasSemana,
        minutos_sesion: minutos
      });
      setSavedPlanId(plan_id);

      // Rutinas semana 1 + detalle
      for (const d of dias) {
        const foco = focoPorDia[d] ?? 'full';
        const rutina_id = await crearRutinaDia({ plan_id, user_id: user_id as any, semana: 1, dia_semana: d, foco, minutos });
        const items = itemsPorDia[d] ?? [];
        if (items.length) await agregarEjerciciosARutina(rutina_id, user_id as any, items);
      }

  success('Rutina creada ✔️');
  setPaso('resumen');
  // Redirigimos al viewer para validar que quedó guardada
  navigate('/fit/plan', { replace: true });
    } catch (e:any) {
      console.error(e);
      toastError(`Error: ${e.message ?? e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
  <div className="p-4 space-y-4 text-[color:var(--vc-foreground,#e7e7ea)]">
      {/* Neon keyframes locales para pulsar botones */}
      <style>
        {`
          @keyframes neonPulseSoft { 0%, 100% { box-shadow: 0 0 0 1px rgba(0,255,231,0.28), 0 0 18px rgba(0,255,231,0.12);} 50% { box-shadow: 0 0 0 1px rgba(0,255,231,0.42), 0 0 24px rgba(0,255,231,0.18);} }
        `}
      </style>
      {/* Logo superior */}
      <div className="w-full flex justify-center mt-2">
        <img src="/branding/Logo 2 Vita.png" alt="VitaCard 365" className="h-20 sm:h-24 object-contain drop-shadow-[0_0_24px_rgba(240,99,64,0.55)]" />
      </div>
      <div className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Crear mi rutina</h1>
            <p className="text-sm opacity-70">Diseña tu plan.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={()=>navigate('/fit/progreso')}
              className="px-3 py-2 rounded-xl text-sm border border-cyan-300/20 bg-cyan-400/10 text-cyan-100/90 hover:bg-cyan-400/20 hover:shadow-[0_0_16px_2px_rgba(0,255,255,0.12)]"
              style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.28)', animation: 'neonPulseSoft 2.2s ease-in-out infinite' }}
              aria-label="Ver mi progreso"
            >
              Ver Progreso
            </button>
            <button
              type="button"
              onClick={()=>navigate('/fit/plan')}
              className="px-3 py-2 rounded-xl text-sm border border-cyan-300/20 bg-cyan-400/10 text-cyan-100/90 hover:bg-cyan-400/20 hover:shadow-[0_0_16px_2px_rgba(0,255,255,0.12)]"
              style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.28)', animation: 'neonPulseSoft 2.2s ease-in-out infinite' }}
              aria-label="Ver mi plan"
            >
              Ver Plan
            </button>
          </div>
        </div>
      </div>

      <Card hoverable>
        <div className="grid grid-cols-3 sm:grid-cols-5 text-xs">
          {(['objetivo','estructura','dias','ejercicios','resumen'] as Paso[]).map(p => (
            <button key={p} onClick={()=>setPaso(p)}
              className={`px-2 py-3 transition-colors border-b ${paso===p ? 'font-semibold border-[color:var(--vc-primary,#f06340)] text-white' : 'opacity-70 border-transparent hover:text-white/90'}`}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </Card>

      {/* Paso 1 */}
      {paso==='objetivo' && (
        <Card className="p-4 space-y-4" hoverable>
          <SectionTitle label="Objetivo del plan" />
          <div className="flex gap-2 overflow-x-auto">
            {(['musculo','grasa','movilidad','cardio','mixto'] as const).map(o=>(
              <button key={o} onClick={()=>setObjetivo(o)}
                className={`px-3 py-2 rounded-xl border transition-colors ${
                  objetivo===o
                    ? 'bg-vita-orange text-white border-vita-orange'
                    : 'border-white/10 hover:border-vita-orange hover:bg-vita-orange/20'
                }`}>{o}</button>
            ))}
          </div>

          <SectionTitle label="Duración y frecuencia" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs opacity-70">Semanas</label>
              <div className="mt-1 flex items-stretch gap-2">
                <button type="button" onClick={()=>setSemanas(v=>Math.max(1, v-1))} className="px-3 rounded-xl bg-[color:var(--vc-primary,#f06340)]/20 border border-[color:var(--vc-primary,#f06340)] text-white">−</button>
                <input type="number" min={1} max={24} value={semanas} onChange={e=>setSemanas(parseInt(e.target.value||'1'))}
                       className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]" />
                <button type="button" onClick={()=>setSemanas(v=>Math.min(24, v+1))} className="px-3 rounded-xl bg-[color:var(--vc-primary,#f06340)]/20 border border-[color:var(--vc-primary,#f06340)] text-white">＋</button>
              </div>
            </div>
            <div>
              <label className="text-xs opacity-70">Días/semana</label>
              <div className="mt-1 flex items-stretch gap-2">
                <button type="button" onClick={()=>setDiasSemana(v=>Math.max(2, v-1))} className="px-3 rounded-xl bg-[color:var(--vc-primary,#f06340)]/20 border border-[color:var(--vc-primary,#f06340)] text-white">−</button>
                <input type="number" min={2} max={7} value={diasSemana} onChange={e=>setDiasSemana(parseInt(e.target.value||'2'))}
                       className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]" />
                <button type="button" onClick={()=>setDiasSemana(v=>Math.min(7, v+1))} className="px-3 rounded-xl bg-[color:var(--vc-primary,#f06340)]/20 border border-[color:var(--vc-primary,#f06340)] text-white">＋</button>
              </div>
            </div>
            <div>
              <label className="text-xs opacity-70">Min/Sesión</label>
              <div className="flex gap-2 mt-1">
                {[15,25,40].map(m=>(
                  <button key={m} onClick={()=>setMinutos(m)}
                    className={`px-3 py-2 rounded-xl border transition-colors ${
                      minutos===m
                        ? 'bg-vita-orange text-white border-vita-orange'
                        : 'border-white/10 hover:border-vita-orange hover:bg-vita-orange/20'
                    }`}>{m}′</button>
                ))}
              </div>
            </div>
          </div>

          <button disabled={!puedeContinuarObjetivo} onClick={()=>setPaso('estructura')}
            className="w-full mt-2 py-3 rounded-2xl font-semibold bg-[color:var(--vc-primary,#f06340)]/90 text-white disabled:opacity-50">
            Continuar
          </button>
        </Card>
      )}

      {/* Paso 2 */}
      {paso==='estructura' && (
        <Card className="p-4 space-y-4" hoverable>
          <SectionTitle label="Foco por día" hint="Upper/Lower/Full/Movilidad/Cardio/Core" />
          <div className="grid grid-cols-1 gap-3">
            {Array.from({length: diasSemana}, (_,i)=>i+1).map(d=>(
              <div key={d} className="p-3 rounded-xl bg-white/10 border border-cyan-400/20"
                   style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.22)' }}>
                <div className="text-sm mb-2 font-semibold text-[color:var(--vc-primary,#f06340)]">Día {d}</div>
                <div className="flex flex-wrap gap-2">
                  {focos.map(f=>(
                    <button key={f} onClick={()=>setFocoPorDia(prev=>({...prev,[d]:f}))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        focoPorDia[d]===f
                          ? 'bg-vita-orange text-white border-vita-orange'
                          : 'border-white/10 hover:border-vita-orange hover:bg-vita-orange/20'
                      }`}>
                      {focoLabel[f]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex gap-2">
            <button onClick={()=>setPaso('objetivo')} className="flex-1 py-3 rounded-2xl bg-white/10">Atrás</button>
            <button onClick={()=>setPaso('dias')} className="flex-1 py-3 rounded-2xl font-semibold bg-[color:var(--vc-primary,#f06340)]/90 text-white">Continuar</button>
          </div>
        </Card>
      )}

      {/* Paso 3 */}
      {paso==='dias' && (
        <Card className="p-4 space-y-4" hoverable>
          <SectionTitle label="Ejercicios por día" hint="agrega sets/reps/tiempo/descanso" />
          <div className="flex gap-2 overflow-x-auto">
              {Array.from({length: diasSemana}, (_,i)=>i+1).map(d=>(
              <button key={d} onClick={()=>setDiaActivo(d)}
                className={`px-3 py-2 rounded-xl border transition-colors ${
                  diaActivo===d
                    ? 'bg-vita-orange text-white border-vita-orange'
                    : 'border-white/10 hover:border-vita-orange hover:bg-vita-orange/20'
                }`}>
                Día {d}
              </button>
            ))}
          </div>

          {/* Lista de items */}
          <div className="space-y-2">
            {(itemsPorDia[diaActivo] ?? []).map((it,idx)=>(
              <div key={idx} className="p-3 rounded-xl bg-black/20 border border-cyan-400/20"
                   style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.18)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm opacity-80">Ejercicio: {it.ejercicio_id.slice(0,8)}…</div>
                  <button onClick={()=>removeItem(diaActivo, idx)} className="text-xs opacity-70">Quitar</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                  <label className="flex flex-col">
                    <span className="opacity-60">Series</span>
                    <input type="number" min={1} max={8} value={it.series}
                      onChange={e=>{
                        const v = parseInt(e.target.value||'1');
                        setItemsPorDia(prev=>{ const arr=[...(prev[diaActivo]??[])]; arr[idx]={...arr[idx],series:v}; return {...prev,[diaActivo]:arr};})
                      }}
                      className="mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"/>
                  </label>
                  <label className="flex flex-col">
                    <span className="opacity-60">Reps</span>
                    <input type="number" min={1} max={50} value={it.reps ?? 10}
                      onChange={e=>{
                        const v = parseInt(e.target.value||'10');
                        setItemsPorDia(prev=>{ const arr=[...(prev[diaActivo]??[])]; arr[idx]={...arr[idx],reps:v,tiempo_seg:null}; return {...prev,[diaActivo]:arr};})
                      }}
                      className="mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"/>
                  </label>
                  <label className="flex flex-col">
                    <span className="opacity-60">Tiempo (s)</span>
                    <input type="number" min={10} max={900} value={it.tiempo_seg ?? 0}
                      onChange={e=>{
                        const v = parseInt(e.target.value||'0')||0;
                        setItemsPorDia(prev=>{ const arr=[...(prev[diaActivo]??[])]; arr[idx]={...arr[idx],tiempo_seg:v>0?v:null}; return {...prev,[diaActivo]:arr};})
                      }}
                      className="mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"/>
                  </label>
                  <label className="flex flex-col">
                    <span className="opacity-60">Descanso (s)</span>
                    <input type="number" min={10} max={300} value={it.descanso_seg ?? 60}
                      onChange={e=>{
                        const v = parseInt(e.target.value||'60');
                        setItemsPorDia(prev=>{ const arr=[...(prev[diaActivo]??[])]; arr[idx]={...arr[idx],descanso_seg:v}; return {...prev,[diaActivo]:arr};})
                      }}
                      className="mt-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"/>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Buscador + filtros */}
          <div className="p-3 rounded-xl bg-white/10 border border-cyan-400/20 overflow-hidden"
               style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.18)' }}>
            <div className="flex gap-2 flex-wrap">
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar ejercicio (press, sentadilla…)"
                     className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]" />
              <button onClick={search} disabled={loadingSearch}
                className="px-4 rounded-xl bg-[color:var(--vc-primary,#f06340)]/90 text-white whitespace-nowrap shrink-0">
                {loadingSearch? '…' : 'Buscar'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={()=>setCatFiltro('todas')}
                className={`px-3 py-1 rounded-full border bg-black/20 transition-colors ${catFiltro==='todas'?'bg-vita-orange/20 text-white border-vita-orange':'border-white/10 hover:border-vita-orange hover:bg-vita-orange/10'}`}>
                Todas
              </button>
              {categorias.map(c=>(
                <button key={c} onClick={()=>setCatFiltro(c)}
                  className={`px-3 py-1 rounded-full border bg-black/20 transition-colors ${catFiltro===c?'bg-vita-orange/20 text-white border-vita-orange':'border-white/10 hover:border-vita-orange hover:bg-vita-orange/10'}`}>
                  {c}
                </button>
              ))}
              <input
                value={equipoFiltro}
                onChange={e=>setEquipoFiltro(e.target.value)}
                placeholder="Equipo (mancuernas, barra, ninguno)"
                className="px-3 py-1 rounded-xl bg-black/30 border border-white/10 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"
              />
              <select
                value={nivelFiltro===undefined ? '' : nivelFiltro}
                onChange={e=>setNivelFiltro(e.target.value===''? undefined : (parseInt(e.target.value) as 0|1|2|3))}
                className="px-3 py-1 rounded-xl bg-black/30 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--vc-primary,#f06340)] focus:border-[color:var(--vc-primary,#f06340)]"
              >
                <option value="">Nivel ≤</option>
                <option value="0">0 (novato)</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3 (avanzado)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-64 overflow-y-auto">
              {resultados.map((r:any)=>(
                <button key={r.id} onClick={()=>pushItem(diaActivo, r.id)}
                  className="p-3 text-left rounded-xl bg-black/20 border border-cyan-400/20 hover:bg-cyan-400/10 transition-colors"
                  style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.16)' }}>
                  <div className="text-sm font-medium">{r.nombre}</div>
                  <div className="text-[11px] opacity-60">{r.categoria} · nivel {r.nivel_base}</div>
                  {r.equipo?.length ? <div className="text-[10px] opacity-60">equipo: {r.equipo.join(', ')}</div> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button onClick={()=>setPaso('estructura')} className="flex-1 py-3 rounded-2xl bg-white/10">Atrás</button>
            <button onClick={()=>setPaso('ejercicios')} className="flex-1 py-3 rounded-2xl font-semibold bg-[color:var(--vc-primary,#f06340)]/90 text-white">Continuar</button>
          </div>
        </Card>
      )}

      {/* Paso 4 */}
      {paso==='ejercicios' && (
        <Card className="p-4 space-y-4" hoverable>
          <SectionTitle label="Resumen rápido" hint="Semana 1" />
          <div className="space-y-2">
            {Array.from({length: diasSemana}, (_,i)=>i+1).map(d=>(
              <div key={d} className="p-3 rounded-xl bg-white/10 border border-cyan-400/20"
                   style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.18)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold"><span className="text-[color:var(--vc-primary,#f06340)]">Día {d}</span> — {focoPorDia[d] ?? 'full'}</div>
                  <button onClick={()=>{setDiaActivo(d);setPaso('dias')}} className="text-xs opacity-80">Editar</button>
                </div>
                <div className="mt-2 text-xs opacity-80">
                  {(itemsPorDia[d]?.length ?? 0) > 0 ? (
                    <ul className="list-disc pl-5">
                      {itemsPorDia[d].map((it,idx)=>(
                        <li key={idx}>ex {it.ejercicio_id.slice(0,6)}… — {it.series}×{it.reps ?? `${it.tiempo_seg}s`} / rest {it.descanso_seg ?? 60}s</li>
                      ))}
                    </ul>
                  ) : <span>Sin ejercicios añadidos</span>}
                </div>
              </div>
            ))}
          </div>

          <button disabled={saving} onClick={guardarTodo}
            className="w-full py-3 rounded-2xl font-semibold bg-[color:var(--vc-primary,#f06340)]/90 text-white disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar plan'}
          </button>
        </Card>
      )}

      {/* Final */}
      {paso==='resumen' && (
        <>
          <Card className="p-6 text-center space-y-2">
            <div className="text-2xl font-bold">Listo ✅</div>
            <div className="opacity-80 text-sm">
              Plan creado {savedPlanId ? `(${savedPlanId.slice(0,8)}…)` : ''}. Puedes ir a Entrenamiento cuando quieras.
            </div>
            <button onClick={()=>setPaso('objetivo')}
                    className="mt-2 px-4 py-2 rounded-xl bg-white/10">Crear otro</button>
          </Card>
          <ReminderPanel />
        </>
      )}

      {/* Banner inferior */}
      <div className="w-full flex justify-center pb-8">
        <img src="/branding/13.png" alt="VitaCard 365" className="w-full max-w-xl" />
      </div>

      <div className={Capacitor.getPlatform()!=='web' ? 'h-12' : ''}/>
      {/* Modal de recordatorios semi-automático */}
      <Modal
        open={showReminders}
        onClose={()=>setShowReminders(false)}
        title="Activa recordatorios de tu rutina"
      >
        <p className="text-sm opacity-80 mb-3">
          Te sugerimos horarios para tus días de entrenamiento. Puedes cambiarlos antes de activar.
        </p>
        <ReminderPanel
          compact
          defaultTime={defaultReminderTime}
          defaultDays={defaultReminderDays}
          onActivated={()=>{ setShowReminders(false); success('Recordatorios activados ✔️'); }}
        />
      </Modal>
    </div>
  );
}
