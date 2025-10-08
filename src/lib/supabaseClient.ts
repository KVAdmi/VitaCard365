import { createClient } from '@supabase/supabase-js';

// Usar directamente la URL completa con https:// para evitar problemas
const url = 'https://ymwhgkeomyuevsckljdw.supabase.co';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o';

// Debug completo
console.log('=== SUPABASE DEBUG ===');
console.log('VITE_SUPABASE_URL (hardcoded):', url);
console.log('VITE_SUPABASE_ANON_KEY: present');
console.log('=====================');

// Ya no es necesario verificar si las variables están definidas porque están hardcodeadas

// exporta una sola instancia
export const supabase = createClient(url, anon, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    detectSessionInUrl: true, // web: detecta /auth/callback; nativo: usamos appUrlOpen
    autoRefreshToken: true,
    storageKey: 'vita-auth',
    storage: SupabaseStorage as any
  },
});
import { SupabaseStorage } from './supabaseStorage';
