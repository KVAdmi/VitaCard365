import { supabase } from '@/lib/supabaseClient';

export type ChatLimitResult = { allowed: boolean; remaining: number; limit: number };

const DAILY_LIMIT = 10;

export async function checkAndIncrementChat(): Promise<ChatLimitResult> {
  // Llama al RPC increment_chat_usage, que incrementa si no excede el límite
  const { data, error } = await supabase.rpc('increment_chat_usage', { lim: DAILY_LIMIT });
  if (error) {
    console.warn('[chatLimit] RPC error:', error);
    // En caso de error, por seguridad NO permitir (evita abuso si falla el control)
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }
  const row = Array.isArray(data) ? data[0] : data;
  const allowed = !!row?.allowed;
  const remaining = Number.isFinite(row?.remaining) ? row.remaining : 0;
  return { allowed, remaining, limit: DAILY_LIMIT };
}
