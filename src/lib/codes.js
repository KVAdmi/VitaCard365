// Client-side helpers for promo/seller codes without touching payment gateway config
import { supabase } from '@/lib/supabaseClient';

function normalizeCode(raw) {
  return (raw || '').trim().toUpperCase();
}

export async function validateSellerCode(rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return { valid: false, reason: 'empty' };
  try {
    const { data, error } = await supabase
      .from('seller_codes')
      .select('code, active, max_uses, used_count, discount_price')
      .eq('code', code)
      .maybeSingle();
    if (error) return { valid: false, reason: 'query_error', error };
    if (!data) return { valid: false, reason: 'not_found' };
    const { active, max_uses, used_count, discount_price } = data;
    if (!active) return { valid: false, reason: 'inactive' };
    if (max_uses != null && used_count >= max_uses) return { valid: false, reason: 'exhausted' };
    const price = Number(discount_price);
    if (!Number.isFinite(price) || price <= 0) return { valid: false, reason: 'bad_price' };
    return { valid: true, code, discount_price: price };
  } catch (e) {
    return { valid: false, reason: 'exception', error: e };
  }
}

export const PromoStorage = {
  key: 'vc.promo.code',
  save(code) {
    try { if (code) localStorage.setItem(this.key, normalizeCode(code)); } catch {}
  },
  load() {
    try { return normalizeCode(localStorage.getItem(this.key)); } catch { return ''; }
  },
  clear() {
    try { localStorage.removeItem(this.key); } catch {}
  }
};
