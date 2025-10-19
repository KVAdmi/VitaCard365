import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Prefer server-side vars; fall back to Vite vars for convenience when running locally
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('⛔ Missing Supabase URL. Set SUPABASE_URL or VITE_SUPABASE_URL in your environment (.env)');
  process.exit(1);
}
if (!serviceKey) {
  console.error('⛔ Missing service role key. Set SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) in your environment (.env)');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const users = [
  { email: 'ivettedelmoral@gmail.com', password: 'Vita2025@' },
  { email: 'rocmontt@gmail.com',       password: 'Vita2025@' },
  { email: 'vguerra@kodigovivo.com',   password: 'Vita2025@' },
];

for (const u of users) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { origen: 'individual' }
    });
    if (error) {
      const msg = error.message || '';
      console.error(`⛔ Error creando ${u.email}:`, msg);
      // If the user already exists, try to find their id and report it
      if (/already been registered|User already registered|already registered/i.test(msg)) {
        try {
          // list users in reasonable pages until we find by email
          let page = 1;
          const perPage = 200;
          let found = null;
          while (!found) {
            const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage });
            if (listErr) break;
            const arr = listData?.users || [];
            found = arr.find(us => (us.email || '').toLowerCase() === u.email.toLowerCase());
            if (!arr.length || arr.length < perPage) break; // no more pages
            page += 1;
          }
          if (found) {
            console.log(`ℹ️  Ya existía ${u.email} → user_id=${found.id}`);
          } else {
            console.log(`ℹ️  Ya existía ${u.email}, no se pudo obtener user_id (no encontrado en listado)`);
          }
        } catch (e2) {
          console.log(`ℹ️  Ya existía ${u.email}, fallo al obtener user_id: ${e2?.message || e2}`);
        }
      }
    } else {
      console.log(`✅ Creado ${u.email} → user_id=${data.user?.id}`);
    }
  } catch (e) {
    console.error(`⛔ Excepción creando ${u.email}:`, e?.message || e);
  }
}

console.log('Done.');
