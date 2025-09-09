const express = require('express');
const mercadopago = require('mercadopago');

const router = express.Router();
mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

router.post('/preference', async (req, res) => {
  try {
    const { plan='Individual', frequency='Mensual', amount=199 } = req.body || {};
    const { body } = await mercadopago.preferences.create({
      items: [{ title:`Vita365 ${plan} ${frequency}`, quantity:1, currency_id:'MXN', unit_price:Number(amount) }],
      back_urls: {
        success: `${process.env.PUBLIC_URL}/payment/success`,
        failure: `${process.env.PUBLIC_URL}/payment/failure`,
        pending: `${process.env.PUBLIC_URL}/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
    });
    res.json({ preferenceId: body.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'mp_pref_error', detail: e.message });
  }
});

router.post('/webhook', express.raw({ type: '*/*' }), (_req, res) => res.sendStatus(200));

module.exports = router;
