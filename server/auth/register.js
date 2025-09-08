import { nanoid } from 'nanoid';
import { computeEntitlements } from '../../src/lib/entitlements';
import { generateVitaId, getBinForSource } from '../../src/lib/vitaId';
import { validateEnv } from '../../src/lib/env';
import jwt from 'jsonwebtoken';
import { supabase } from '../../src/lib/supabaseClient';

// POST /auth/register
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    validateEnv();
    const { email, name, source, partner_code, mp_preapproval_id } = req.body;
    if (!email || !name || !source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Generar folio universal (ID Vita) con BIN correcto
    const bin = getBinForSource(source, partner_code);
    let id_vita;
    let attempts = 0;
    do {
      id_vita = generateVitaId(bin);
      // Verificar unicidad en DB
      const { data, error } = await supabase
        .from('subscribers')
        .select('id')
        .eq('email', email)
        .eq('id_vita', id_vita);
      if (!data || data.length === 0) break;
      attempts++;
    } while (attempts < 5);
    if (attempts === 5) {
      return res.status(500).json({ error: 'Could not generate unique Vita ID' });
    }

    // 2. Asignar entitlements (prioridad: KV/Enterprise/Partner > MP)
    const entitlements = await computeEntitlements({ email, source, partner_code, mp_preapproval_id });

    // 3. Crear usuario y folio de forma atómica
    const { data: user, error: userError } = await supabase
      .from('subscribers')
      .insert({ email, name, id_vita, source, partner_code, entitlements })
      .select();
    if (userError) {
      return res.status(500).json({ error: 'DB error', details: userError });
    }

    // 4. Generar JWT con claims
    const token = jwt.sign({
      id_vita,
      email,
      entitlements,
      source,
      partner_code,
      exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 min TTL
    }, process.env.JWT_SECRET);

    // 5. Bypass de pago si entitlement premium/enterprise/partner
    const bypass = entitlements.includes('premium') || entitlements.includes('enterprise') || entitlements.includes('partner');

    // 6. Logging (opcional)
    console.log(`[REGISTER] email=${email} id_vita=${id_vita} source=${source} entitlements=${entitlements}`);

    return res.status(201).json({
      id_vita,
      email,
      name,
      entitlements,
      source,
      partner_code,
      token,
      bypass
    });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
