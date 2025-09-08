// Middleware para proteger endpoints core
export function requirePaid(req, res, next) {
  const user = req.user; // seteado por auth middleware
  if (!user) return res.status(401).json({ code:'UNAUTHENTICATED' });
  if (user.entitlements !== 'PAID') {
    return res.status(403).json({ code:'PAYWALL', message:'Acceso restringido a usuarios con suscripción activa o folio válido.' });
  }
  next();
}

// Mini listado de endpoints core protegidos (gating duro)
// Aplica requirePaid:
// POST /profile/certificate
// PUT /profile/certificate
// GET /profile/certificate (si devuelve datos sensibles)
// POST /vita/issue
// GET /vita/me
// POST /files/upload
// GET /files/private/**
// POST /features/**
// GET /features/**
// POST /records/**
// GET /records/**
// Cualquier POST|PUT|DELETE /api/** que ejecute acciones de valor

// Quedan públicos (sin requirePaid, pero con auth/según aplique):
// POST /auth/register, POST /auth/login, POST /auth/refresh
// GET /me/entitlements
// GET /api/billing/plans
// POST /api/billing/subscriptions (solo permitido si entitlements === 'NONE')
// POST /api/webhooks/mercadopago
// GET /health / GET /status
// Endpoints admin siguen con auth de administrador (no requirePaid)
