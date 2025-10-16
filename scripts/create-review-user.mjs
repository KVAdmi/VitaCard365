import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('⛔ Missing env: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* equivalents).');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3] || 'Vita!Review48';
if (!email) {
  console.error('Usage: node scripts/create-review-user.mjs <email> [password]');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function findUserIdByEmail(email) {
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
}

try {
  // If exists, just ensure password
  const existingId = await findUserIdByEmail(email);
  if (existingId) {
    await supabase.auth.admin.updateUserById(existingId, { password });
    console.log(`ℹ️  User already existed. Password updated for ${email}`);
    process.exit(0);
  }

  // Create fresh confirmed user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { origen: 'play-review' }
  });
  if (error) {
    console.error('⛔ Failed creating user:', error.message);
    process.exit(1);
  }
  console.log(`✅ Created ${email} → user_id=${data.user?.id}`);
  process.exit(0);
} catch (e) {
  console.error('⛔ Error:', e?.message || e);
  process.exit(1);
}
