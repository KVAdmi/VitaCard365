// src/lib/access.ts
import { supabase } from '@/lib/supabaseClient';

export type AccessInfo = {
  acceso_activo: boolean;
  membresia: 'individual'|'familiar'|'empresarial'|'kv'|string|null;
  periodicidad: 'mensual'|'trimestral'|'semestral'|'anual'|'vitalicio'|string|null;
  estado_pago: string|null;
};

export async function getCurrentUid(): Promise<string|null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

export async function fetchAccess(uid?: string|null): Promise<AccessInfo|null> {
  const user_id = uid ?? await getCurrentUid();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from('profiles_certificado_v2')
    .select('acceso_activo,membresia,periodicidad,estado_pago')
    .eq('user_id', user_id)
    .limit(1)
    .single();
  if (error) return null;
  return data as unknown as AccessInfo;
}

export async function ensureAccess(): Promise<{allowed:boolean; info:AccessInfo|null}> {
  const info = await fetchAccess();
  return { allowed: !!info?.acceso_activo, info: info ?? null };
}
