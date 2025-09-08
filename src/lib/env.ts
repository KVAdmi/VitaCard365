// Mercado Pago env helper

const requiredEnv = [
  'MP_PUBLIC_KEY',
  'MP_ACCESS_TOKEN',
  'MP_USE_SANDBOX',
  'APP_BASE_URL',
  'MP_WEBHOOK_URL',
  'JWT_SECRET'
];

export function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Faltan variables de entorno Mercado Pago: ${missing.join(', ')}`);
  }
}

export const env = {
  mpPublicKey: process.env.MP_PUBLIC_KEY,
  mpAccessToken: process.env.MP_ACCESS_TOKEN,
  mpUseSandbox: process.env.MP_USE_SANDBOX === 'true',
  appBaseUrl: process.env.APP_BASE_URL,
  mpWebhookUrl: process.env.MP_WEBHOOK_URL,
  jwtSecret: process.env.JWT_SECRET,
  mpClientId: process.env.MP_CLIENT_ID,
  mpClientSecret: process.env.MP_CLIENT_SECRET,
  productoVitaId: process.env.PRODUCTO_VITA_ID,
};
