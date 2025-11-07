// ==========================
// server-email.js  (ESM, microservidor de correos)
// ==========================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ===== ENV =====
// ===== ENV (con fallbacks a VITE_*) =====
const RESEND_API_KEY =
  process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

const EMAIL_FROM =
  process.env.EMAIL_FROM || 'VitaCard365 <contacto@vitacard365.com>';

const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.PUBLIC_URL ||
  process.env.VITE_PUBLIC_URL ||
  'http://localhost:5174';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL ||
  process.env.VITE_API_BASE ||
  process.env.VITE_FRONTEND_BASE ||
  'http://localhost:5174';

const NODE_ENV = process.env.NODE_ENV;
const PORT = Number(process.env.PORT_EMAIL || 3100);

// ===== App =====
const app = express();
app.use(express.json());

// ===== CORS =====
const allowedOrigins = [
  'https://vitacard365.com',
  'https://www.vitacard365.com',
  'http://localhost:5174',
  'http://localhost:3000',
  FRONTEND_BASE_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin && NODE_ENV !== 'production') return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      console.log('[CORS][email] blocked origin:', origin);
      return cb(new Error('No permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
  })
);

// ===== Supabase (admin) =====
if (!SUPABASE_URL) console.warn('[EMAIL] Falta SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) console.warn('[EMAIL] Falta SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ===== Resend helper =====
async function sendEmailResend({ to, subject, html, tags = [] }) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY no configurada');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      tags,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[Resend][email] error:', data);
    throw new Error(`Resend failed: ${res.status} ${res.statusText}`);
  }
  return data;
}

// ===== Plantillas =====
function baseEmailShell({ title, bodyHtml }) {
  return `
  <div style="font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f7f7f8;padding:32px;color:#0f172a">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="padding:24px 24px 0 24px">
        <h1 style="font-size:20px;margin:0 0 8px 0;color:#0f172a">${title}</h1>
      </td></tr>
      <tr><td style="padding:8px 24px 24px 24px;font-size:14px;line-height:1.6;color:#334155">
        ${bodyHtml}
        <p style="margin-top:24px;color:#475569;font-size:12px;border-top:1px solid #e2e8f0;padding-top:12px">
          Si necesitas ayuda, responde a este correo: contacto@vitacard365.com
        </p>
      </td></tr>
    </table>
  </div>`;
}
function tplPasswordReset({ name = '¡Hola!', resetUrl }) {
  return baseEmailShell({
    title: 'Recupera tu contraseña',
    bodyHtml: `
      <p>${name}, recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#0ea5e9;color:#ffffff;text-decoration:none">Restablecer contraseña</a></p>
      <p>Si no fuiste tú, ignora este mensaje.</p>`,
  });
}
function tplPaymentApproved({ name = '¡Gracias!', amount = '', paymentId = '', plan = '' }) {
  return baseEmailShell({
    title: 'Pago confirmado',
    bodyHtml: `
      <p>${name}, tu pago fue <strong>aprobado</strong>.</p>
      <ul>
        ${amount ? `<li>Monto: <strong>${amount}</strong></li>` : ''}
        ${paymentId ? `<li>ID de pago: <strong>${paymentId}</strong></li>` : ''}
        ${plan ? `<li>Plan: <strong>${plan}</strong></li>` : ''}
      </ul>
      <p>Tu membresía ha sido activada.</p>`,
  });
}
function tplWelcome({ name = 'Bienvenida/o' }) {
  return baseEmailShell({
    title: 'Bienvenida/o a VitaCard365',
    bodyHtml: `
      <p>${name}, tu cuenta está activa. Ya puedes entrar y empezar.</p>
      <p>¡Gracias por unirte!</p>`,
  });
}

// ==========================
// ENDPOINTS (solo correos)
// ==========================

// Health
app.get('/email/health', (_req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

// Resend directo (debug)
app.post('/email/debug', async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: 'to requerido' });
    const r = await sendEmailResend({
      to,
      subject: 'Prueba Resend',
      html: '<p>Prueba directa Resend desde VitaCard365.</p>',
      tags: [{ name: 'type', value: 'debug' }],
    });
    console.log('[email/debug] sent', r);
    res.json({ ok: true, id: r.id });
  } catch (e) {
    console.error('[email/debug] ERROR', e);
    res.status(500).json({ error: 'Resend no envió' });
  }
});

// Recuperación de contraseña
app.post('/email/auth/request-password-reset', async (req, res) => {
  console.log('[email/reset] hit', { email: req.body?.email, t: new Date().toISOString() });
  try {
    const { email, redirectTo } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email requerido' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'supabase admin no configurado' });

    const redirect = redirectTo || `${APP_BASE_URL}/auth/reset-password`;
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirect },
    });

    console.log('[email/reset] supabase data?', Boolean(data), 'error?', error?.message);
    if (error) return res.status(500).json({ error: 'no se pudo generar link de recuperación' });

    const resetUrl = data?.properties?.action_link;
    if (!resetUrl) return res.status(500).json({ error: 'sin action_link' });

    await sendEmailResend({
      to: email,
      subject: 'Recupera tu contraseña',
      html: tplPasswordReset({ name: 'Hola', resetUrl }),
      tags: [{ name: 'type', value: 'password_reset' }],
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('[email/reset] ERROR:', e);
    res.status(500).json({ error: 'falló el envío de correo' });
  }
});

// Bienvenida manual
app.post('/email/users/welcome', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email requerido' });

    await sendEmailResend({
      to: email,
      subject: 'Bienvenida/o a VitaCard365',
      html: tplWelcome({ name: name || 'Bienvenida/o' }),
      tags: [{ name: 'type', value: 'welcome' }],
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('[email/welcome] ERROR:', e);
    res.status(500).json({ error: 'falló el envío de bienvenida' });
  }
});

// ===== START (puerto 3100) =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📧 Email server escuchando en puerto ${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/email/health`);
});
