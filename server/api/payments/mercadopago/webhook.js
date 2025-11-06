
const { MercadoPagoConfig, Payment } = require('mercadopago');
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const { sendPaymentConfirmationEmail } = require('../../lib/email');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body || {};
    if (type === 'payment' && data?.id) {
      const pago = await new Payment(client).get({ id: data.id });
      const status = pago.body.status;
      const user_id = pago.body.external_reference;
      const payment_id = pago.body.id;
      const amount = pago.body.transaction_amount;
      const paidAt = pago.body.date_approved || new Date().toISOString();
      // Actualizar estado de pago
      if (status === 'approved' && user_id) {
        await supabase
          .from('member_billing')
          .update({ estado_pago: 'pagado' })
          .eq('user_id', user_id);

        // Idempotencia: registrar envío en notif_emails
        let alreadySent = false;
        try {
          const { error: insertErr } = await supabase
            .from('notif_emails')
            .insert({ user_id, payment_id: String(payment_id), kind: 'payment_confirmed' });
          if (insertErr && insertErr.code === '23505') {
            alreadySent = true;
          }
        } catch (e) {
          // Si la tabla no existe, loguear y continuar
          console.warn('notif_emails insert error:', e);
        }
        if (!alreadySent) {
          // Obtener email y nombre del usuario
          let userEmail = null, userName = '';
          try {
            const { data: user } = await supabase
              .from('usuarios')
              .select('email, nombre')
              .eq('id', user_id)
              .single();
            userEmail = user?.email;
            userName = user?.nombre || '';
          } catch (e) {
            console.warn('No se pudo obtener email/nombre del usuario', e);
          }
          if (userEmail) {
            try {
              await sendPaymentConfirmationEmail({
                to: userEmail,
                userName,
                amount,
                paymentId: String(payment_id),
                plan: 'Membresía VitaCard365',
                paidAt,
              });
            } catch (e) {
              console.error('Error enviando email de confirmación de pago:', e);
            }
          }
        }
      }
      console.log('Pago MP:', pago.body.id, pago.body.status, 'user_id:', user_id);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook MP error:', err);
    res.sendStatus(200); // nunca devolver 500 a MP
  }
});

module.exports = router;
