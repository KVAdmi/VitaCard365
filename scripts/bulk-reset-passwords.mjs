import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) { console.error('Missing env SUPABASE_URL and service role key'); process.exit(1); }
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const emails = process.argv.slice(2);
const newPassword = process.env.BULK_NEW_PASSWORD || 'Vita2025@';
if (emails.length === 0) {
  console.error('Uso: node scripts/bulk-reset-passwords.mjs <email1> <email2> ...');
  process.exit(1);
}

const findUserIdByEmail = async (email) => {
  let page = 1; const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const arr = data?.users || [];
    const found = arr.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (!arr.length || arr.length < perPage) return null;
    page += 1;
  }
};

for (const email of emails) {
  try {
    const userId = await findUserIdByEmail(email);
    if (!userId) {
      console.log(`No encontrado: ${email}. Creando usuario...`);
      const { data, error } = await supabase.auth.admin.createUser({ email, password: newPassword, email_confirm: true });
      if (error) throw error;
      console.log(`Creado ${email} → ${data.user?.id}`);
      continue;
    }
    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw error;
    console.log(`Password updated for ${email}`);
  } catch (e) {
    console.error(`Error con ${email}:`, e?.message || e);
  }
}
