
const { Router } = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const router = Router();

console.log('MP TOKEN PREFIX:', (process.env.MP_ACCESS_TOKEN||'').slice(0,8));
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);

router.post('/preference', async (req, res) => {
  try {
    const { plan='Individual', frequency='Mensual', amount=199 } = req.body || {};
    const body = {
      items: [{
        title: `Vita365 ${String(plan)} ${String(frequency)}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'MXN',
      }],
      back_urls: {
        success: `${process.env.PUBLIC_URL}/payment/success`,
        failure: `${process.env.PUBLIC_URL}/payment/failure`,
        pending: `${process.env.PUBLIC_URL}/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
    };

    const resp = await preference.create({ body });
    const pid = resp?.id || resp?.body?.id;
    if (!pid) throw new Error('no_pref_id');
    res.json({ preferenceId: pid });
  } catch (e) {
    // Log detallado para diagnosticar
    console.error('MP PREF ERROR →', {
      status: e?.status,
      message: e?.message,
      name: e?.name,
      cause: e?.cause,
      stack: e?.stack?.split('\n').slice(0,3).join(' | ')
    });
    const status = e?.status || 500;
    res.status(status).json({ error: 'mp_pref_error', detail: e?.message, cause: e?.cause });
  }
});

module.exports = router;
