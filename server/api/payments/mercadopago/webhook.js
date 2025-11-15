const { MercadoPagoConfig, Payment } = require('mercadopago');
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body || {};
    if (type === 'payment' && data?.id) {
      const pago = await new Payment(client).get({ id: data.id });
      const status = pago.body.status;
      const user_id = pago.body.external_reference;
      if (status === 'approved' && user_id) {
        // Marca como pagado el último registro de ese usuario
        await supabase
          .from('member_billing')
          .update({ estado_pago: 'pagado' })
          .eq('user_id', user_id);

        // Obtener datos del usuario
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, nombre, plan, id_vita')
          .eq('id', user_id)
          .single();
        if (!userError && userData?.email) {
          const { sendEmail, EMAIL_LOGO_URL } = require('../../lib/email');
          const subject = 'Tu VitaCard365 está activa';
          const html = `
            <div style="background:#fff;padding:32px 16px;border-radius:16px;text-align:center;max-width:480px;margin:auto;font-family:sans-serif;">
              <img src="${EMAIL_LOGO_URL}" alt="VitaCard365" style="display:block;margin:0 auto;max-width:180px;height:auto;" />
              <h2 style="color:#ff7a00;margin-top:24px;">¡Tu VitaCard365 está activa!</h2>
              <p>Hola ${userData.nombre || ''},</p>
              <p>Tu membresía <b>${userData.plan || ''}</b> está activa.<br />
              ID Vita: <b>${userData.id_vita || user_id}</b><br />
              Estado: <b>Pagado</b></p>
              <p>Ya puedes acceder a la app y disfrutar tus beneficios.</p>
              <a href="https://vitacard365.com/login" style="display:inline-block;margin-top:24px;padding:12px 32px;background:#ff7a00;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Entrar a VitaCard365</a>
              <p style="margin-top:32px;font-size:12px;color:#888;">Si tienes dudas, responde este correo.</p>
            </div>
          `;
          try {
            await sendEmail({ to: userData.email, subject, html });
            console.log('[email] Confirmación enviada a', userData.email);
          } catch (e) {
            console.error('[email] Error al enviar confirmación:', e);
          }
        }
      }
      console.log('Pago MP:', pago.body.id, pago.body.status, 'user_id:', user_id);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook MP error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
