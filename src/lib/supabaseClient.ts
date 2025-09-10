import { createClient } from '@supabase/supabase-js';

// Asegurarse de que la URL tenga el formato correcto (https://)
const urlRaw = import.meta.env.VITE_SUPABASE_URL;
const url = urlRaw?.startsWith('http') ? urlRaw : `https://${urlRaw}`;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug completo
console.log('=== SUPABASE DEBUG ===');
console.log('VITE_SUPABASE_URL (original):', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_URL (corregida):', url);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing');
console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
console.log('=====================');

if (!url || !anon) {
  // Error claro y temprano (no pantalla en blanco con stack raro)
  throw new Error(
    `[Supabase] Variables faltantes. VITE_SUPABASE_URL=${String(url)} VITE_SUPABASE_ANON_KEY=${anon ? 'present' : 'missing'}`
  );
}

// exporta una sola instancia
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'vita-auth',
    storage: window.localStorage
  },
});
