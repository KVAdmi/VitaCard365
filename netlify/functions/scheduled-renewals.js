// Netlify Scheduled Function: Generate renewal preferences for due memberships
// NOTE: Does NOT change Mercado Pago config; it just creates new one-time preferences
// Schedule this function with Netlify Scheduled Functions (daily)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MP_SERVER_URL = process.env.MP_SERVER_URL || 'http://54.175.250.15:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event, context) {
  // simple guard to avoid accidental web trigger unless scheduled
  const isScheduled = event.headers && (event.headers['x-nf-scheduled'] || event.headers['X-Nf-Scheduled']);
  if (!isScheduled) {
    return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'forbidden' }) };
  }

  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayISO = today.toISOString();

    // 1) Find due memberships (member_billing) that are pagado and vencen hoy
    const { data: due, error } = await supabase
      .from('member_billing')
      .select('id, user_id, membresia, periodicidad, price_base, promo_code, channel, pagado_hasta')
      .eq('estado_pago', 'pagado')
      .lte('pagado_hasta', todayISO);

    if (error) throw error;
    if (!due || due.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, processed: 0 }) };
    }

    let processed = 0;
    for (const bill of due) {
      try {
        // 2) Compute next amount client-like: use price_base as baseline here
        // If you want more dynamic logic, you can adjust with pricing_rules here.
        const amount = Number(bill.price_base || 0);
        if (!Number.isFinite(amount) || amount <= 0) continue;

        // 3) Ask your MP server to create a new preference (one-time) for renewal
        const payload = {
          plan: bill.membresia || 'Individual',
          frequency: (bill.periodicidad || 'Mensual'),
          amount,
          // Optional metadata for reconciliation
          promo_code: bill.promo_code || undefined,
          channel: bill.channel || undefined,
          renewal: true,
          previous_billing_id: bill.id,
        };
        const resp = await fetch(`${MP_SERVER_URL}/api/mercadopago/preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (!resp.ok || !data || !data.init_point) {
          // log and continue; do not throw to avoid blocking others
          console.warn('[renewals] preference error:', bill.id, data);
          continue;
        }

        // 4) Insert a pending billing row for tracking (optional, keep existing schema)
        await supabase.from('member_billing').insert({
          user_id: bill.user_id,
          membresia: bill.membresia || 'individual',
          periodicidad: bill.periodicidad || 'mensual',
          estado_pago: 'pendiente',
          proveedor: 'mercadopago',
          monto_total: amount,
          price_base: amount,
          price_charged: null,
          promo_code: bill.promo_code || null,
          channel: bill.channel || null,
          descripcion: 'Renovación programada',
        });

        // 5) Optionally: send email/notification to user with data.init_point
        // (omitted here; integrate with your notifier service)

        processed++;
      } catch (e) {
        console.error('[renewals] error per bill', bill.id, e);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, processed }) };
  } catch (e) {
    console.error('[renewals] fatal', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
}
