import { supabase } from '@/lib/supabaseClient';

/** Fetch helper que agrega Authorization: Bearer <JWT> si hay sesión. */
export async function fetchWithAuth(path: string, init: RequestInit = {}) {
  const base = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  const url = `${base}/${path}`;
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(url, { ...init, headers });
}