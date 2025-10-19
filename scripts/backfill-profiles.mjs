import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('⛔ Falta SUPABASE_URL/VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_SERVICE_ROLE_KEY en tu entorno (.env)');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// Emails objetivo; puedes pasar otros por CLI separados por comas
const arg = process.argv[2];
const emails = (arg ? arg.split(',') : [
  'ivettedelmoral@gmail.com',
  'rocmontt@gmail.com',
  'vguerra@kodigovivo.com',
]).map(e => e.trim().toLowerCase());

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const arr = data?.users || [];
    const found = arr.find(u => (u.email || '').toLowerCase() === email);
    if (found) return found;
    if (!arr.length || arr.length < perPage) return null;
    page += 1;
  }
}

async function upsertProfile(uid, email) {
  const name = email.split('@')[0] || 'Usuario';
  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: uid,
      email,
      name,
      plan_status: 'inactive',
      origen: 'individual',
    }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function upsertCertificado(uid) {
  const { error } = await supabase
    .from('profiles_certificado_v2')
    .upsert({
      user_id: uid,
      acceso_activo: false,
      estado_pago: 'pendiente',
      membresia: 'individual',
    }, { onConflict: 'user_id' });
  if (error) throw error;
}

(async () => {
  async function ensureDefaultPlan(uid) {
    try {
      const { data: exists } = await supabase
        .from('planes')
        .select('id')
        .eq('user_id', uid)
        .limit(1)
        .maybeSingle();
      if (exists?.id) return;
      const semanas = 1;
      const dias_semana = 4;
      const minutos_sesion = 45; // evitar fallo en minutos_sesion_check
      const kcal_objetivo = dias_semana * minutos_sesion * 5; // base 5 kcal/min
      const payload = {
        user_id: uid,
        objetivo: 'musculo', // valores válidos: grasa|musculo|movilidad|cardio|mixto
        semanas,
        dias_semana,
        minutos_sesion,
        kcal_objetivo,
        estado: 'activo',
        macros: {},
      };
      const { error } = await supabase.from('planes').insert(payload);
      if (error) throw error;
    } catch (e) {
      console.warn(`⚠️  No se pudo crear plan por defecto para ${uid}:`, e?.message || e);
    }
  }

  async function grantLifetime(uid) {
    // Inserta una fila en member_billing con membresia 'kv' y estado 'pagado' sin fecha de vencimiento
    const payload = {
      user_id: uid,
      membresia: 'kv',
      periodicidad: 'vitalicio',
      estado_pago: 'pagado',
      pagado_desde: new Date().toISOString(),
      pagado_hasta: null,
      es_titular: true,
      family_id: null,
    };
    const { error } = await supabase.from('member_billing').insert(payload);
    if (error) throw error;
  }

  for (const email of emails) {
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        console.log(`⚠️  Usuario no encontrado en auth: ${email}`);
        continue;
      }
      const uid = user.id;
      await ensureDefaultPlan(uid);
      await upsertProfile(uid, email);
      await grantLifetime(uid);
      console.log(`✅ Backfill OK → ${email} (user_id=${uid})`);
    } catch (e) {
      console.error(`⛔ Falló backfill para ${email}:`, e?.message || e);
    }
  }
  console.log('Done.');
})();
