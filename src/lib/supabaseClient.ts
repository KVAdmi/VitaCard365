import { createClient } from '@supabase/supabase-js';
import { SupabaseStorage } from './supabaseStorage';

// Preferir variables de entorno; hacer fallback a valores existentes para no romper builds locales
const ENV_URL = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
const ENV_ANON = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const FALLBACK_URL = 'https://ymwhgkeomyuevsckljdw.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o';

export const SUPABASE_URL = ENV_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = ENV_ANON || FALLBACK_ANON;

// exporta una sola instancia (PKCE + persistencia). En móvil el retorno es por deep link, no por URL web
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'vita-auth',
    storage: SupabaseStorage as any,
  },
});
