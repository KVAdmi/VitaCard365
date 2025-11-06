const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPaymentConfirmationEmail({
  to,
  userName = '',
  amount,
  paymentId,
  plan = 'Membresía VitaCard365',
  paidAt
}) {
  const from = `${process.env.EMAIL_FROM_NAME || 'VitaCard365'} <${process.env.EMAIL_FROM}>`;
  const subject = 'Pago confirmado — VitaCard365';
  const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  const appUrl = process.env.APP_BASE_URL || 'https://vitacard365.com';
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#222;">
    <div style="text-align:center;padding:24px 0;">
      <img src="${appUrl}/assets/logo.png" alt="VitaCard365" width="120" />
      <h2 style="margin:16px 0 0; color:#1e88e5;">Pago confirmado</h2>
    </div>
    <p>Hola ${userName},</p>
    <p>Tu pago fue <b>aprobado</b>. Gracias por confiar en <b>VitaCard365</b>.</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr>
        <td style="padding:8px 0;">Plan</td><td style="padding:8px 0;"><b>${plan}</b></td>
      </tr>
      <tr>
        <td style="padding:8px 0;">Monto</td><td style="padding:8px 0;"><b>${currency}</b></td>
      </tr>
      <tr>
        <td style="padding:8px 0;">Fecha</td><td style="padding:8px 0;"><b>${new Date(paidAt).toLocaleString('es-MX')}</b></td>
      </tr>
      <tr>
        <td style="padding:8px 0;">ID de pago</td><td style="padding:8px 0;"><code>${paymentId}</code></td>
      </tr>
    </table>
    <p style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/app/recibo/${encodeURIComponent(paymentId)}"
         style="background:#1e88e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;">
        Ver comprobante
      </a>
    </p>
    <p style="color:#666">Si no reconoces este cargo, responde a este correo.</p>
    <p style="margin-top:32px;color:#999">— Equipo VitaCard365</p>
  </div>`;
  return resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    reply_to: process.env.EMAIL_FROM,
  });
}

module.exports = { sendPaymentConfirmationEmail };
