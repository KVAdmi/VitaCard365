import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM_EMAIL = process.env.EMAIL_FROM || "contacto@vitacard365.com";
const FROM_NAME  = process.env.EMAIL_FROM_NAME || "VitaCard365";
const APP_URL    = process.env.APP_BASE_URL || "https://vitacard365.com";

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  userName?: string;
  amount?: number;           // MXN
  paymentId: string;
  plan?: string;
  paidAt?: string;           // ISO
}) {
  const monto = params.amount != null
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(params.amount)
    : undefined;

  const html = `
<table style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;width:100%;padding:32px 0;">
  <tr><td align="center">
    <table style="max-width:600px;background:#fff;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="background:#1e88e5;padding:24px;text-align:center;color:#fff;">
          <img src="${APP_URL}/assets/logo.png" alt="VitaCard365" width="110" style="margin-bottom:10px;" />
          <h2 style="margin:0;font-size:22px;">Pago confirmado</h2>
        </td>
      </tr>
      <tr><td style="padding:24px;color:#333;">
        <p>Hola <b>${params.userName || "usuario"}</b>,</p>
        <p>Tu pago fue <b>aprobado</b> y tu membresía ya está activa.</p>
        <table style="width:100%;margin:16px 0;border-collapse:collapse;">
          ${params.plan ? `<tr><td>Plan</td><td style="text-align:right"><b>${params.plan}</b></td></tr>` : ""}
          ${monto ? `<tr><td>Monto</td><td style="text-align:right"><b>${monto}</b></td></tr>` : ""}
          ${params.paidAt ? `<tr><td>Fecha</td><td style="text-align:right">${new Date(params.paidAt).toLocaleString("es-MX")}</td></tr>` : ""}
          <tr><td>ID de pago</td><td style="text-align:right">${params.paymentId}</td></tr>
        </table>
        <p style="text-align:center;margin:24px 0;">
          <a href="${APP_URL}/app/recibo/${encodeURIComponent(params.paymentId)}"
             style="background:#1e88e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
             Ver mi comprobante
          </a>
        </p>
        <p style="color:#666;">Gracias por tu confianza en VitaCard365.</p>
      </td></tr>
      <tr><td style="background:#f9fafb;text-align:center;padding:16px;color:#888;font-size:12px;">
        © ${new Date().getFullYear()} VitaCard365. Todos los derechos reservados.
      </td></tr>
    </table>
  </td></tr>
</table>`;

  return resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [params.to],
  subject: "Pago confirmado — VitaCard365",
    html,
  replyTo: FROM_EMAIL
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  userName?: string;
}) {
  const html = `
<table style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;width:100%;padding:32px 0;">
  <tr><td align="center">
    <table style="max-width:600px;background:#fff;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="background:#1e88e5;padding:24px;text-align:center;color:#fff;">
          <img src="${APP_URL}/assets/logo.png" alt="VitaCard365" width="110" style="margin-bottom:10px;" />
          <h2 style="margin:0;font-size:22px;">¡Bienvenida a VitaCard365!</h2>
        </td>
      </tr>
      <tr><td style="padding:24px;color:#333;">
        <p>Hola <b>${params.userName || "usuario"}</b>,</p>
        <p>Tu membresía quedó activa. Desde hoy puedes disfrutar de todos los beneficios:</p>
        <ul style="line-height:1.6;color:#555;">
          <li>Asistencia y salud 24/7.</li>
          <li>Beneficios de bienestar y protección.</li>
          <li>Acceso total desde la app o portal.</li>
        </ul>
        <p style="text-align:center;margin:28px 0;">
          <a href="${APP_URL}/app"
             style="background:#1e88e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
             Ingresar a mi cuenta
          </a>
        </p>
        <p style="color:#666;">¿Dudas? Escríbenos a <a href="mailto:contacto@vitacard365.com">contacto@vitacard365.com</a>.</p>
      </td></tr>
      <tr><td style="background:#f9fafb;text-align:center;padding:16px;color:#888;font-size:12px;">
        © ${new Date().getFullYear()} VitaCard365. Todos los derechos reservados.
      </td></tr>
    </table>
  </td></tr>
</table>`;

  return resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [params.to],
  subject: "¡Bienvenida! Tu membresía ya está activa — VitaCard365",
    html,
  replyTo: FROM_EMAIL
  });
}
