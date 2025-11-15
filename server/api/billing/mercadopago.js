const express = require('express');
const mercadopago = require('mercadopago');


// TODO: Patty podrá cambiar estos valores sin tocar el resto del código
const MP_RETURN_BASE_URL_WEB = 'https://vitacard365.com/perfil';
const MP_RETURN_BASE_URL_APP = 'vitacard365://mp-return';

const router = express.Router();
mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

router.post('/preference', async (req, res) => {
  try {
    const { plan='Individual', frequency='Mensual', amount=199, origin } = req.body || {};
    const isFromApp = origin === 'app';
    const returnBaseUrl = isFromApp ? MP_RETURN_BASE_URL_APP : MP_RETURN_BASE_URL_WEB;

    const back_urls = {
      success: `${returnBaseUrl}?from=mp&status=success`,
      failure: `${returnBaseUrl}?from=mp&status=failure`,
      pending: `${returnBaseUrl}?from=mp&status=pending`,
    };

    const { body } = await mercadopago.preferences.create({
      items: [{ title:`Vita365 ${plan} ${frequency}`, quantity:1, currency_id:'MXN', unit_price:Number(amount) }],
      back_urls,
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
