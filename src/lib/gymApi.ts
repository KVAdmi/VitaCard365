import { supabase } from '@/lib/supabaseClient';

export type GymCircuit = {
  id: string;
  user_id: string | null;
  name: string;
  notes: string | null;
  is_public: boolean;
  tags: any | null;
  created_at: string;
  updated_at: string;
};

export type GymCircuitItem = {
  id: string;
  circuit_id: string;
  orden: number;
  ejercicio_id: string;
  series: number;
  reps: number | null;
  tiempo_seg: number | null;
  descanso_seg: number;
};

export async function listPublicCircuits(): Promise<GymCircuit[]> {
  const { data, error } = await supabase
    .from('gym_circuits')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listMyCircuits(): Promise<GymCircuit[]> {
  const u = await supabase.auth.getUser();
  const uid = u.data.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('gym_circuits')
    .select('*')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCircuitWithItems(id: string): Promise<{ circuit: GymCircuit | null, items: GymCircuitItem[] }>{
  const { data: c, error: e1 } = await supabase
    .from('gym_circuits')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();
  if (e1) throw e1;
  const { data: items, error: e2 } = await supabase
    .from('gym_circuit_items')
    .select('*')
    .eq('circuit_id', id)
    .order('orden', { ascending: true });
  if (e2) throw e2;
  return { circuit: c ?? null, items: items || [] };
}

export async function createCircuit(name: string, notes: string | null, tags?: any): Promise<GymCircuit> {
  const u = await supabase.auth.getUser();
  const uid = u.data.user?.id;
  if (!uid) throw new Error('Necesitas iniciar sesión para guardar tu circuito.');
  // Enviar user_id explícitamente para cumplir políticas RLS (WITH CHECK user_id = auth.uid())
  const payload: any = { name, notes: notes ?? null, is_public: false, tags: tags ?? null, user_id: uid };
  const { data, error } = await supabase
    .from('gym_circuits')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as GymCircuit;
}

export async function updateCircuit(id: string, patch: Partial<Pick<GymCircuit, 'name'|'notes'|'tags'>>): Promise<void> {
  const { error } = await supabase
    .from('gym_circuits')
    .update({ ...patch })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCircuit(id: string): Promise<void> {
  const { error } = await supabase
    .from('gym_circuits')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function replaceCircuitItems(circuit_id: string, items: Array<Omit<GymCircuitItem, 'id'|'circuit_id'>>): Promise<void> {
  // Delete existing then insert new (within RLS: only owner can)
  let { error: e1 } = await supabase.from('gym_circuit_items').delete().eq('circuit_id', circuit_id);
  if (e1) throw e1;
  if (!items.length) return;
  const rows = items.map((it, idx) => ({
    circuit_id,
    orden: it.orden ?? idx + 1,
    ejercicio_id: it.ejercicio_id,
    series: it.series ?? 3,
    reps: it.reps ?? null,
    tiempo_seg: it.tiempo_seg ?? null,
    descanso_seg: it.descanso_seg ?? 60,
  }));
  const { error: e2 } = await supabase.from('gym_circuit_items').insert(rows as any);
  if (e2) throw e2;
}
