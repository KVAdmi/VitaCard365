import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Anatomia = {
  musculos_principales?: string[];
  musculos_secundarios?: string[];
};

export type Ejercicio = {
  id: string;
  slug?: string | null;
  nombre: string;
  categoria?: string | null; // empuje, tiron, rodilla, cadera, core, movilidad, cardio
  tipo?: string | null; // fuerza, rehabilitación, cardio, movilidad, etc.
  nivel_base?: number | null; // 0-3
  equipo: string[]; // equipo normalizado
  cues: string[]; // indicaciones
  contraindicaciones: string[];
  imagen_url?: string | null;
  video_url?: string | null;
  variantes?: string[];
  anatomia?: Anatomia;
};

function stripOuterQuotes(s: string) {
  let out = s.trim();
  // Remove repeated wrapping quotes
  while ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1);
    out = out.trim();
  }
  return out;
}

// Parses Postgres text[] (e.g., {a,b}) or weird escaped strings into string[]
function parseStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean).map((x) => String(x));
  if (val == null) return [];
  if (typeof val === 'object') {
    // Some fields like variantes may be { variantes: [...] }
    if (Array.isArray((val as any).variantes)) return (val as any).variantes.map(String);
    return [];
  }
  let s = String(val);
  s = stripOuterQuotes(s);

  // Try JSON array first
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map(String);
    } catch {}
  }
  // Try JSON object with key 'variantes'
  if (s.startsWith('{') && s.endsWith('}') && s.includes(':')) {
    try {
      const obj = JSON.parse(s);
      if (Array.isArray(obj?.variantes)) return obj.variantes.map(String);
    } catch {}
  }
  // Try Postgres array format: {a,b,c}
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    // Split by comma not inside quotes; here we assume simple values
    const parts = inner
      .split(',')
      .map((p) => {
        let token = p.replace(/\\\"/g, '"').replace(/\\/g, '');
        token = stripOuterQuotes(token).trim();
        // Remove any stray array/object brackets often present in malformed values
        token = token.replace(/[\[\]{}]/g, '');
        return token;
      })
      .filter((t) => t.length > 0);
    return parts;
  }
  // Fallback: a single value
  return s ? [s] : [];
}

function parseAnatomia(val: any): Anatomia | undefined {
  if (!val) return undefined;
  if (typeof val === 'object') return val as Anatomia;
  const s = stripOuterQuotes(String(val));
  try {
    const obj = JSON.parse(s);
    const out: Anatomia = {};
    if (Array.isArray(obj?.musculos_principales)) out.musculos_principales = obj.musculos_principales.map(String);
    if (Array.isArray(obj?.musculos_secundarios)) out.musculos_secundarios = obj.musculos_secundarios.map(String);
    return out;
  } catch {
    return undefined;
  }
}

function toEjercicio(row: any): Ejercicio {
  return {
    id: row.id,
    slug: row.slug ?? null,
    nombre: row.nombre || 'Ejercicio',
    categoria: row.categoria ?? null,
    tipo: row.tipo ?? row.tipo_ejercicio ?? null,
    nivel_base: typeof row.nivel_base === 'number' ? row.nivel_base : Number(row.nivel_base ?? 0),
    equipo: parseStringArray(row.equipo),
    cues: parseStringArray(row.cues),
    contraindicaciones: parseStringArray(row.contraindicaciones),
    imagen_url: row.imagen_url ?? null,
    video_url: row.video_url ?? null,
    variantes: parseStringArray(row.variantes),
    anatomia: parseAnatomia(row.anatomia),
  };
}

export function useEjerciciosCatalog() {
  const [data, setData] = useState<Ejercicio[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('ejercicios')
          .select(
            'id,slug,nombre,categoria,nivel_base,equipo,cues,contraindicaciones,imagen_url,tipo,variantes,video_url,anatomia'
          )
          .order('nombre', { ascending: true });
        if (error) throw error;
        const list = (data || []).map(toEjercicio);
        if (alive) setData(list);
      } catch (e: any) {
        console.error('Error cargando ejercicios', e);
        if (alive) setError(e?.message || 'Error desconocido');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, []);

  const equipos = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((e) => (e.equipo || []).forEach((x) => set.add(x.toLowerCase())));
    return Array.from(set).sort();
  }, [data]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((e) => e.categoria && set.add(e.categoria));
    return Array.from(set).sort();
  }, [data]);

  const tipos = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((e) => e.tipo && set.add(e.tipo));
    return Array.from(set).sort();
  }, [data]);

  return { data, loading, error, equipos, categorias, tipos };
}
