import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Uso: node scripts/test-login.mjs <email> <password>');
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

try {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', { message: error.message, name: error.name, status: error.status });
    process.exit(2);
  }
  console.log('Login OK. User ID:', data?.user?.id);
  process.exit(0);
} catch (e) {
  console.error('Unexpected error:', e);
  process.exit(3);
}
