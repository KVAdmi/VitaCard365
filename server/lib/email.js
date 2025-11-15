const nodemailer = require('nodemailer');

const EMAIL_LOGO_URL =
  'https://ymwhgkeomyuevsckljdw.supabase.co/storage/v1/object/public/logo/Vita.png';

// Variables de entorno para SMTP de Amazon SES
const SMTP_HOST = process.env.SMTP_HOST;      // ej: email-smtp.us-east-1.amazonaws.com
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;      // usuario SMTP de SES
const SMTP_PASS = process.env.SMTP_PASS;      // password SMTP de SES
const SMTP_FROM = process.env.SMTP_FROM || 'VitaCard365 <noreply@vitacard365.com>';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true solo si usamos 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Enviar email usando Amazon SES vía SMTP.
 * La firma NO debe cambiar porque ya la usa el webhook de Mercado Pago.
 */
async function sendEmail({ to, subject, html }) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[email] SMTP no configurado, email no enviado', {
      to,
      subject,
    });
    return null;
  }

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });

  console.log('[email] Enviado vía SES:', info.messageId || info);
  return info;
}

module.exports = {
  sendEmail,
  EMAIL_LOGO_URL,
};