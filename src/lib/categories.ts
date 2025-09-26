// src/lib/categories.ts
export type Categoria = 'empuje'|'tiron'|'rodilla'|'cadera'|'core'|'movilidad'|'cardio';

export const CAT_COLORS: Record<Categoria, {bg:string; text:string; ring:string}> = {
  empuje:    { bg:'bg-cyan-500/15',    text:'text-cyan-300',    ring:'ring-cyan-400/30' },
  tiron:     { bg:'bg-indigo-500/15',  text:'text-indigo-300',  ring:'ring-indigo-400/30' },
  rodilla:   { bg:'bg-emerald-500/15', text:'text-emerald-300', ring:'ring-emerald-400/30' },
  cadera:    { bg:'bg-amber-500/15',   text:'text-amber-300',   ring:'ring-amber-400/30' },
  core:      { bg:'bg-violet-500/15',  text:'text-violet-300',  ring:'ring-violet-400/30' },
  movilidad: { bg:'bg-teal-500/15',    text:'text-teal-300',    ring:'ring-teal-400/30' },
  cardio:    { bg:'bg-red-500/15',     text:'text-red-300',     ring:'ring-red-400/30' },
};

export const VITA = {
  bg: 'from-[#0B1F3A] via-[#0B1F3A]/90 to-black',
  cta: '#FF5A2A',
  text: '#E6EAF2',
};
