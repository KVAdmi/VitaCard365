// src/features/rutinas/api.ts
import { supabase } from '@/lib/supabaseClient';

// ===== Tipos (BD real) =====
export type ObjetivoPlan = 'musculo' | 'grasa' | 'movilidad' | 'cardio' | 'mixto';
export type FocoDia = 'full' | 'upper' | 'lower' | 'movilidad' | 'cardio' | 'core';

export type CategoriaEjercicio =
  | 'empuje' | 'tiron' | 'rodilla' | 'cadera' | 'core' | 'movilidad' | 'cardio';

export type EjercicioCatalogo = {
  id: string;
  slug: string;
  nombre: string;
  categoria: CategoriaEjercicio;
  nivel_base: number;       // 0..3
  equipo: string[];         // ['ninguno'] | ['mancuernas'] | ...
  cues: string[];
  contraindicaciones: string[];
  imagen_url: string | null;
  tipo: string | null;
  variantes: Record<string, unknown> | null;
  video_url: string | null;
  anatomia: Record<string, unknown> | null;
};

export type BuscarEjerciciosParams = {
  q?: string;
  categoria?: CategoriaEjercicio | 'todas';
  equipoIncluye?: string;            // 'mancuernas' | 'barra' | 'ninguno'...
  nivelMax?: 0 | 1 | 2 | 3;
  limit?: number;
};

// ===== Auth util =====
export async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('No hay sesión activa');
  return uid!;
}

// ===== Buscador SOLO en public.ejercicios =====
export async function buscarEjercicios(params: BuscarEjerciciosParams = {}): Promise<EjercicioCatalogo[]> {
  const { q = '', categoria = 'todas', equipoIncluye, nivelMax, limit = 40 } = params;

  let query = supabase
    .from('ejercicios')
    .select('id, slug, nombre, categoria, nivel_base, equipo, cues, contraindicaciones, imagen_url, tipo, variantes, video_url, anatomia');

  if (q.trim().length) {
    query = query.or(`nombre.ilike.%${q}%,slug.ilike.%${q}%`);
  }
  if (categoria !== 'todas') {
    query = query.eq('categoria', categoria);
  }
  if (equipoIncluye && equipoIncluye.length > 0) {
    // requiere columna equipo como array/text[]
    query = query.contains('equipo', [equipoIncluye]);
  }
  if (typeof nivelMax === 'number') {
    query = query.lte('nivel_base', nivelMax);
  }

  const { data, error } = await query
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as EjercicioCatalogo[];
}

// ===== Plan =====
export async function crearPlan(params: {
  user_id: string;
  objetivo: ObjetivoPlan;
  semanas: number;
  dias_semana: number;
  minutos_sesion: number; // int libre
}): Promise<string> {
  const { user_id, objetivo, semanas, dias_semana, minutos_sesion } = params;

  const { data, error } = await supabase
    .from('planes')
    .insert([{
      user_id,
      objetivo: objetivo.toLowerCase(),
      semanas,
      dias_semana,
      minutos_sesion,
      kcal_objetivo: 0,
      macros: {},
      estado: 'activo'
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data!.id as string;
}

// ===== Rutina (día) =====
export async function crearRutinaDia(params: {
  plan_id: string;
  user_id: string;
  semana: number;
  dia_semana: number;   // 1..7
  foco: FocoDia;
  minutos: number;
  rpe_objetivo?: number; // default 7.0
}): Promise<string> {
  const { plan_id, user_id, semana, dia_semana, foco, minutos, rpe_objetivo = 7.0 } = params;

  const { data, error } = await supabase
    .from('rutinas')
    .insert([{
      plan_id, user_id, semana, dia_semana, foco, minutos, rpe_objetivo, estado: 'pendiente'
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data!.id as string;
}

export type RutinaItemInput = {
  ejercicio_id: string;
  series: number;
  reps?: number | null;
  tiempo_seg?: number | null;
  descanso_seg?: number; // default 60
  rpe?: number;          // default 7
  variante?: string | null;
};

// ===== Detalle (rutina_ejercicios) con retry si no existe progresion_json =====
export async function agregarEjerciciosARutina(rutina_id: string, user_id: string, items: RutinaItemInput[]) {
  const payloadBase = items.map(it => ({
    rutina_id,
    user_id,
    ejercicio_id: it.ejercicio_id,
    series: it.series,
    reps: it.reps ?? null,
    tiempo_seg: it.tiempo_seg ?? null,
    descanso_seg: it.descanso_seg ?? 60,
    rpe: it.rpe ?? 7,
    variante: it.variante ?? null
  }));

  // Intento 1: con progresion_json
  const { error } = await supabase.from('rutina_ejercicios').insert(
    payloadBase.map(p => ({ ...p, progresion_json: {} }))
  );

  if (error && /column .*progresion_json/i.test(error.message)) {
    // Intento 2: sin la columna
    const retry = await supabase.from('rutina_ejercicios').insert(payloadBase);
    if (retry.error) throw retry.error;
    return;
  }

  if (error) throw error;
}
