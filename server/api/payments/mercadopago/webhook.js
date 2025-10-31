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
