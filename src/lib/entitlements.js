// Helper: computeEntitlements
// Prioridad: KV/ENTERPRISE > MP_SUBSCRIPTION
import { supabase } from './supabase';

export async function computeEntitlements(subscriberId) {
  // 1. KV/ENTERPRISE
  const { data: kvEnt } = await supabase
    .from('subscriber_entitlements')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('active', true)
    .lte('starts_at', new Date().toISOString())
    .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString())
    .in('source', ['KV', 'ENTERPRISE']);

  if (kvEnt && kvEnt.length > 0) {
    const ent = kvEnt[0];
    return {
      entitlements: 'PAID',
      source: ent.source,
      sourceCode: ent.source_code,
      tenant: ent.tenant,
      endsAt: ent.ends_at,
    };
  }

  // 2. MP_SUBSCRIPTION
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .order('created_at', { ascending: false });

  if (subs && subs.length > 0) {
    const sub = subs[0];
    switch (sub.status) {
      case 'ACTIVE':
        return { entitlements: 'PAID', source: 'MP_SUBSCRIPTION', subStatus: 'ACTIVE', mpPreapprovalId: sub.mp_preapproval_id };
      case 'PAUSED':
        return { entitlements: 'PAUSED', source: 'MP_SUBSCRIPTION', subStatus: 'PAUSED', mpPreapprovalId: sub.mp_preapproval_id };
      case 'PAST_DUE':
        return { entitlements: 'PAST_DUE', source: 'MP_SUBSCRIPTION', subStatus: 'PAST_DUE', mpPreapprovalId: sub.mp_preapproval_id };
      case 'CANCELLED':
        return { entitlements: 'CANCELLED', source: 'MP_SUBSCRIPTION', subStatus: 'CANCELLED', mpPreapprovalId: sub.mp_preapproval_id };
      case 'PENDING_AUTH':
      default:
        return { entitlements: 'NONE', source: 'MP_SUBSCRIPTION', subStatus: sub.status, mpPreapprovalId: sub.mp_preapproval_id };
    }
  }

  // 3. NONE
  return { entitlements: 'NONE' };
}
