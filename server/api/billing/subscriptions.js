// Bloqueo explícito para suscripciones
import { computeEntitlements } from '../../src/lib/entitlements';

export default async function handler(req, res) {
  const user = req.user; // seteado por auth middleware
  if (!user) return res.status(401).json({ code:'UNAUTHENTICATED' });
  const ent = await computeEntitlements(user.id);
  if (ent.entitlements === 'PAID' && ['KV','PARTNER','ENTERPRISE'].includes(ent.source)) {
    return res.status(409).json({ code:'ALREADY_PAID', source: ent.source });
  }
  // ...lógica normal de creación de suscripción MP...
  res.status(501).json({ error: 'Not implemented' });
}
