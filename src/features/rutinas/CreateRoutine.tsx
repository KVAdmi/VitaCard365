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
// Alias simples de equipo para evitar quedarnos sin resultados por nombres distintos
const equipoAlias: Record<string,string> = {
  toalla: 'ninguno',
  tapete: 'ninguno',
  alfombra: 'ninguno',
};

export default function CreateRoutine() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [paso, setPaso] = useState<'objetivo' | 'estructura' | 'dias' | 'ejercicios' | 'resumen'>('objetivo');
  const [lugar] = useState<'Gym' | 'Casa'>('Casa');
  const [showHelp, setShowHelp] = useState(true);

  // Paso 1
  const [objetivo, setObjetivo] = useState<'musculo' | 'grasa' | 'movilidad' | 'cardio' | 'mixto'>('musculo');
  const [semanas, setSemanas] = useState(4);
  const [diasSemana, setDiasSemana] = useState(4);
  const [minutos, setMinutos] = useState<number>(25); // int libre; UI MVP 15/25/40

  // Paso 2
  const [focoPorDia, setFocoPorDia] = useState<Record<number, FocoDia>>({ 1:'upper', 2:'lower', 3:'full', 4:'movilidad' });

  // Paso 3
  const [diaActivo, setDiaActivo] = useState(1);
  // Tipo local para mostrar nombre en UI, sin afectar el payload del API
  type RutinaItemLocal = RutinaItemInput & { displayName?: string };
  const [itemsPorDia, setItemsPorDia] = useState<Record<number, RutinaItemLocal[]>>({});

  // Buscador + filtros
  const [query, setQuery] = useState('');
  const [catFiltro, setCatFiltro] = useState<CategoriaEjercicio | 'todas'>('todas');
  const [equipoFiltro, setEquipoFiltro] = useState<string>('');
  const [nivelFiltro, setNivelFiltro] = useState<0|1|2|3|undefined>(undefined);
  const [resultados, setResultados] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  // Catálogo guiado
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogCat, setCatalogCat] = useState<CategoriaEjercicio | 'todas'>('todas');
  const [catalogEquipo, setCatalogEquipo] = useState<string>('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogRes, setCatalogRes] = useState<any[]>([]);
  const [catalogNotice, setCatalogNotice] = useState<string>('');

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

  async function loadCatalog(cat?: CategoriaEjercicio|'todas', equipo?: string) {
    setCatalogLoading(true);
    try {
      const eqRaw = equipo ?? catalogEquipo;
      const eqMapped = eqRaw ? (equipoAlias[eqRaw] ?? eqRaw) : '';
      const res = await buscarEjercicios({
        q: '',
        categoria: cat ?? catalogCat,
        // Si "equipo" viene null/undefined, usamos "catalogEquipo"; si es cadena vacía, lo mandamos como undefined
        equipoIncluye: eqMapped || undefined,
        nivelMax: 1,
        limit: 60,
      });
      if ((res?.length ?? 0) === 0 && (eqRaw)) {
        // Fallback: reintentar sin filtro de equipo para no dejar al usuario sin opciones
        const res2 = await buscarEjercicios({
          q: '',
          categoria: cat ?? catalogCat,
          nivelMax: 1,
          limit: 60,
        });
        setCatalogRes(res2);
        setCatalogNotice('Sin resultados con ese equipo. Mostramos alternativas sin equipo.');
      } else {
        setCatalogRes(res);
        setCatalogNotice('');
      }
    } finally { setCatalogLoading(false); }
  }

  function pushItem(dia: number, exId: string, preset?: Partial<RutinaItemLocal>) {
    const base: RutinaItemLocal = { ejercicio_id: exId, series: 3, reps: 10, descanso_seg: 60, rpe: 7 };
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

  // Persistencia suave del borrador (no perder progreso si recarga)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vita-routine-draft');
      if (raw) {
        const parsed = JSON.parse(raw);
  // ya no restauramos "lugar"; flujo fijo a Casa
        if (parsed?.objetivo) setObjetivo(parsed.objetivo);
        if (parsed?.semanas) setSemanas(parsed.semanas);
        if (parsed?.diasSemana) setDiasSemana(parsed.diasSemana);
        if (parsed?.minutos) setMinutos(parsed.minutos);
        if (parsed?.focoPorDia) setFocoPorDia(parsed.focoPorDia);
        if (parsed?.itemsPorDia) setItemsPorDia(parsed.itemsPorDia);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      const draft = { objetivo, semanas, diasSemana, minutos, focoPorDia, itemsPorDia };
      localStorage.setItem('vita-routine-draft', JSON.stringify(draft));
    } catch {}
  }, [objetivo, semanas, diasSemana, minutos, focoPorDia, itemsPorDia]);

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

  // Ajusta los días sugeridos cuando cambia la frecuencia semanal
  useEffect(()=>{
    setDefaultReminderDays(suggestDays(diasSemana));
  }, [diasSemana]);

  async function guardarTodo() {
    setSaving(true);
    try {
      const user_id = await getUserId();
      // Verificación de acceso (membresía) antes de guardar
      const { allowed } = await ensureAccess().catch(() => ({ allowed: false } as any));
      if (!allowed) {
        // Soft gate: permitimos guardar como borrador y ver el plan, pero avisamos.
        toastError('Guardaremos tu plan. Para registrar progreso, activa tu acceso en Pago.');
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
      try {
        localStorage.setItem('vita-last-plan-id', plan_id);
        localStorage.setItem('vita-last-plan-ts', String(Date.now()));
      } catch {}

      // Rutinas semana 1 + detalle
      for (const d of dias) {
        const foco = focoPorDia[d] ?? 'full';
        const rutina_id = await crearRutinaDia({ plan_id, user_id: user_id as any, semana: 1, dia_semana: d, foco, minutos });
        const items = (itemsPorDia[d] ?? []) as (RutinaItemLocal[]);
        if (items.length) {
          const cleanItems: RutinaItemInput[] = items.map(({ displayName: _omit, ...rest }) => ({
            ejercicio_id: rest.ejercicio_id,
            series: rest.series ?? 3,
            reps: rest.tiempo_seg && rest.tiempo_seg > 0 ? null : (rest.reps ?? 10),
            tiempo_seg: rest.tiempo_seg && rest.tiempo_seg > 0 ? rest.tiempo_seg : null,
            descanso_seg: rest.descanso_seg ?? 60,
            rpe: rest.rpe ?? 7,
          }));
          await agregarEjerciciosARutina(rutina_id, user_id as any, cleanItems);
        }
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

  // Guardar rutina y vincular con agenda
  const guardarRutina = async () => {
    try {
      const userId = await getUserId();
      const rutinaId = await crearPlan({
        user_id: userId,
        objetivo,
        semanas,
        dias_semana: diasSemana,
        minutos_sesion: minutos,
      });

      success('Rutina guardada y vinculada a la agenda correctamente.');
      navigate('/dashboard');
    } catch (error) {
      toastError('Error al guardar la rutina. Inténtalo nuevamente.');
    }
  };

  // Definición de la función calcularFechaInicio
  const calcularFechaInicio = (dia: number) => {
    const hoy = new Date();
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(hoy.getDate() + (dia - 1));
    return fechaInicio;
  };

  // Corrección de comparaciones de tipos
  const compararFoco = (f: string) => {
    switch (f) {
      case 'full':
        return 'Todo el cuerpo';
      case 'upper':
        return 'Parte superior';
      case 'lower':
        return 'Parte inferior';
      case 'movilidad':
        return 'Movilidad';
      case 'cardio':
        return 'Cardio';
      case 'core':
        return 'Core';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="p-4 space-y-4 text-[color:var(--vc-foreground,#e7e7ea)]">
      {/* Neon keyframes locales para pulsar botones */}
      <style>
        {`
          @keyframes neonPulseSoft { 0%, 100% { box-shadow: 0 0 0 1px rgba(0,255,231,0.28), 0 0 18px rgba(0,255,231,0.12);} 50% { box-shadow: 0 0 0 1px rgba(0,255,231,0.42), 0 0 24px rgba(0,255,231,0.18);} }
        `}
      </style>
      {/* Logo superior */}
      <div className="w-full flex flex-col items-center mt-2">
        <img src="/branding/Logo 2 Vita.png" alt="VitaCard 365" className="h-20 sm:h-24 object-contain drop-shadow-[0_0_24px_rgba(240,99,64,0.55)]" />
        {/* Título neon centrado */}
        <div className="mt-2 text-xl sm:text-2xl font-extrabold text-cyan-200 drop-shadow-[0_0_12px_rgba(0,255,255,0.5)]" style={{ animation: 'neonPulseSoft 2.2s ease-in-out infinite' }}>
          Diseña tu plan
        </div>
      </div>
      {/* Acciones centradas */}
      <div className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
          <button
            type="button"
            onClick={()=>setShowHelp(true)}
            className="px-3 py-2 rounded-xl text-sm border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            aria-label="¿Cómo funciona?"
          >¿Cómo funciona?</button>
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

      {/* Ayuda inicial */}
      {showHelp && (
        <Card className="p-4" hoverable>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-bold mb-1">Así se crea tu rutina</div>
              <ul className="list-disc pl-5 text-sm opacity-90 space-y-1">
                <li>Paso 1: Elige tu objetivo.</li>
                <li>Paso 2: Marca el <strong>Enfoque por día</strong> (ej. Superior, Piernas, Full).</li>
                <li>Paso 3: En cada día, toca <strong>“Abrir catálogo”</strong> y selecciona ejercicios. Nosotros te sugerimos para principiantes.</li>
                <li>Paso 4: Revisa el resumen y guarda el plan. Lo verás en <strong>“Mi Plan”</strong>.</li>
              </ul>
              <div className="text-xs opacity-70 mt-2">Tip: Si entrenas en casa, el catálogo prioriza ejercicios sin equipo.</div>
            </div>
            <button onClick={()=>setShowHelp(false)} className="px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10">✕</button>
          </div>
        </Card>
      )}

      {/* Paso 1 */}
      {paso==='objetivo' && (
        <Card className="p-4 space-y-4" hoverable>
          {/* Se removió la selección de "¿Dónde entrenarás?"; asumimos Casa */}

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
          <SectionTitle label="Enfoque por día" />
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
                      {f==='upper' ? 'Parte superior' :
                        f==='lower' ? 'Piernas y glúteos' :
                        f==='full' ? 'Todo el cuerpo' :
                        f==='movilidad' ? 'Movilidad' :
                        f==='cardio' ? 'Cardio' :
                        'Centro (abdomen)'}
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
          <SectionTitle label="Ejercicios por día" hint={'Agrega series/reps/tiempo/descanso'} />
          <div className="flex items-center justify-between">
            <div className="text-xs opacity-70">Selecciona un día y agrega ejercicios.</div>
            {Object.values(itemsPorDia).some(arr => (arr?.length ?? 0) > 0) && (
              <button
                onClick={()=>navigate('/fit/plan')}
                className="px-3 py-1.5 rounded-full text-xs border border-cyan-300/30 bg-cyan-400/10 text-cyan-100/90 hover:bg-cyan-400/20"
                aria-label="Ver mi plan"
              >
                Ver mi plan
              </button>
            )}
          </div>
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
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs opacity-70">Día {diaActivo}: añade ejercicios sugeridos del catálogo</div>
              <button onClick={()=>{ setShowCatalog(true); setCatalogCat(catFiltro==='todas'? 'core' : (catFiltro as CategoriaEjercicio)); setCatalogEquipo('ninguno'); loadCatalog(catFiltro as any, 'ninguno'); }} className="px-3 py-1.5 rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-cyan-100/90 hover:bg-cyan-400/20">Abrir catálogo</button>
            </div>
            {(itemsPorDia[diaActivo] ?? []).map((it,idx)=>(
              <div key={idx} className="p-3 rounded-xl bg-black/20 border border-cyan-400/20"
                   style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.18)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm opacity-80">Ejercicio: {it.displayName ?? `${it.ejercicio_id.slice(0,8)}…`}</div>
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
                    <span className="opacity-60">Tiempo (segundos)</span>
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
            {/* Parrilla de categorías claras para usuarios nuevos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {[
                {k:'empuje', t:'Empuje', d:'Pecho, hombros, tríceps'},
                {k:'tiron', t:'Tirón', d:'Espalda, bíceps'},
                {k:'rodilla', t:'Piernas (rodilla)', d:'Cuádriceps'},
                {k:'cadera', t:'Piernas (cadera)', d:'Glúteos e isquios'},
                {k:'core', t:'Centro (abdomen)', d:'Estabilidad y postura'},
                {k:'cardio', t:'Cardio', d:'Sin impacto / suave'},
              ].map(cat => (
                <button key={cat.k}
                  onClick={()=>{ setCatFiltro(cat.k as any); setQuery(''); }}
                  className="p-3 rounded-xl bg-white/10 border border-cyan-400/20 text-left hover:bg-cyan-400/10 transition"
                  style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.16)' }}>
                  <div className="text-sm font-semibold">{cat.t}</div>
                  <div className="text-[11px] opacity-70">{cat.d}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca por nombre (press, remo), músculo (pecho) o equipo (mancuernas)"
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
              {/* Sugerencias rápidas */}
              <div className="w-full flex flex-wrap gap-2 mt-1">
                {['pecho','espalda','piernas','hombros','cardio suave','movilidad cadera'].map(s => (
                  <button key={s} onClick={()=>{ setQuery(s); }} className="px-2 py-1 rounded-full text-xs bg-white/10 hover:bg-white/20 border border-white/10">{s}</button>
                ))}
              </div>
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
                <button key={r.id} onClick={()=>{ pushItem(diaActivo, r.id, { displayName: r.nombre }); success && success('Ejercicio añadido'); }}
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
                        <li key={idx}>{it.displayName ?? `ex ${it.ejercicio_id.slice(0,6)}…`} — {it.series}×{it.reps ?? `${it.tiempo_seg}s`} / rest {it.descanso_seg ?? 60}s</li>
                      ))}
                    </ul>
                  ) : (
                    <span>
                      Sin ejercicios añadidos
                      {Object.values(itemsPorDia).some(arr => (arr?.length ?? 0) > 0) && (
                        <>
                          {' '}• <button onClick={()=>navigate('/fit/plan')} className="underline underline-offset-2">Ver mi plan</button>
                        </>
                      )}
                    </span>
                  )}
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
          <ReminderPanel defaultDays={defaultReminderDays} defaultTime={defaultReminderTime} />
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

      {/* Catálogo de ejercicios */}
      <Modal open={showCatalog} onClose={()=>setShowCatalog(false)} title="Catálogo de ejercicios">
        <div className="space-y-3 rounded-2xl border border-cyan-300/20 bg-[#0b1626]/85 backdrop-blur-md p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/90">Catálogo de ejercicios</div>
            <button onClick={()=>setShowCatalog(false)} className="text-sm px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">Cerrar</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['todas',...categorias] as (CategoriaEjercicio|'todas')[]).map(c => (
              <button key={c} onClick={()=>{ setCatalogCat(c); loadCatalog(c, catalogEquipo); }} className={`px-3 py-1 rounded-full border text-sm ${catalogCat===c?'bg-vita-orange/20 text-white border-vita-orange':'border-white/10 hover:border-vita-orange hover:bg-vita-orange/10'}`}>{c}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['ninguno','tapete','toalla','mancuernas','barra','kettlebell','banda','maquina'].map(eq => (
              <button key={eq} onClick={()=>{ setCatalogEquipo(eq); loadCatalog(catalogCat, eq); }} className={`px-3 py-1 rounded-full border text-sm ${catalogEquipo===eq?'bg-vita-orange/20 text-white border-vita-orange':'border-white/10 hover:border-vita-orange hover:bg-vita-orange/10'}`}>{eq}</button>
            ))}
            <button onClick={()=>{ setCatalogEquipo(''); loadCatalog(catalogCat, ''); }} className={`px-3 py-1 rounded-full border text-sm ${catalogEquipo===''?'bg-vita-orange/20 text-white border-vita-orange':'border-white/10 hover:border-vita-orange hover:bg-vita-orange/10'}`}>Todos los equipos</button>
          </div>
          {catalogNotice && (
            <div className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 text-yellow-200 text-xs px-3 py-2">
              {catalogNotice}
            </div>
          )}
          <div className="max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {catalogLoading ? (
              <div className="text-sm opacity-70">Cargando…</div>
            ) : catalogRes.length===0 ? (
              <div className="text-sm opacity-70">No encontramos ejercicios para esos filtros.</div>
            ) : catalogRes.map((r:any) => (
              <button key={r.id} onClick={()=>{ pushItem(diaActivo, r.id, { displayName: r.nombre }); success && success('Añadido'); }} className="p-3 text-left rounded-xl bg-white/10 border border-cyan-400/20 hover:bg-cyan-400/10 transition-colors" style={{ boxShadow: '0 0 0 1px rgba(0,255,231,0.16)' }}>
                <div className="text-sm font-semibold">{r.nombre}</div>
                <div className="text-[11px] opacity-60">{r.categoria} · nivel {r.nivel_base} · {r.equipo?.join(', ')}</div>
              </button>
            ))}
          </div>
          <div className="text-xs opacity-70">Tip: Toca varios y se agregarán al día {diaActivo}. Cierra el catálogo cuando termines.</div>
        </div>
      </Modal>
    </div>
  );
}
