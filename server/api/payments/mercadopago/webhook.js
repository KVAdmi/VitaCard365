const { MercadoPagoConfig, Payment } = require('mercadopago');
const express = require('express');
const router = express.Router();

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body || {};
    if (type === 'payment' && data?.id) {
      const pago = await new Payment(client).get({ id: data.id });
      // TODO: Actualiza tu DB según pago.body.status ('approved', 'pending', etc.)
      console.log('Pago MP:', pago.body.id, pago.body.status);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook MP error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
