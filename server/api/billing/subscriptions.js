// Bloqueo explícito para suscripciones
const entitlements = require('../../lib/entitlements');

module.exports = async function handler(req, res) {
  const user = req.user; // seteado por auth middleware
  if (!user) return res.status(401).json({ code:'UNAUTHENTICATED' });
  const ent = entitlements('Individual', 'Mensual'); // ejemplo, ajusta según tu lógica
  if (ent.plan === 'Individual' && ent.frequency === 'Mensual') {
    // ...lógica normal de creación de suscripción MP...
    return res.status(409).json({ code:'ALREADY_PAID', source: 'KV' });
  }
  res.status(501).json({ error: 'Not implemented' });
}
