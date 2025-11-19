import 'dotenv/config';
import { supabase } from '../src/lib/supabaseClient';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) { console.error('Missing env SUPABASE_URL and service role key'); process.exit(1); }

const email = process.argv[2];
const newPassword = process.argv[3] || 'Vita2025@';
if (!email) { console.error('Usage: node scripts/set-password-by-email.mjs <email> [newPassword]'); process.exit(1); }

const { data, error } = await supabase.auth.admin.updateUserById(
  (await (async () => {
    // lookup user id by email
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
  })()),
  { password: newPassword }
);
if (error) { console.error('Failed to set password:', error.message); process.exit(1); }
console.log(`Password updated for ${email}`);
