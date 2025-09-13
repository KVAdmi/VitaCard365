import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Importar la función
import 'dotenv/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

async function createMpPreference(req, res) {
  try {
    // Si te mandan plan/amount por body, úsalo:
    const { title = 'VitaCard365 Mensual', unit_price = 199, currency_id = 'MXN' } = req.body || {};

    const pref = await new Preference(mp).create({
      body: {
        items: [{ title, quantity: 1, unit_price, currency_id }],
        auto_return: 'approved',
        back_urls: {
          success: 'https://vitacard365.com/payment/success',
          failure: 'https://vitacard365.com/payment/failure',
          pending: 'https://vitacard365.com/payment/pending'
        },
        notification_url: 'https://api.vitacard365.com/api/mercadopago/webhook'
      }
    });

    const id = pref.id || pref.body?.id;
    if (!id) throw new Error('MP preference created without id');

    return res.status(200).json({ preferenceId: id });
  } catch (e) {
    console.error('MP ERROR >>>', {
      message: e?.message,
      name: e?.name,
      cause: e?.cause,
      error: e?.error
    });
    return res.status(500).json({ error: 'mp_pref_error', message: e?.message, cause: e?.cause || e?.error });
  }
}

const app = express();
app.use(cors({
  origin: ['http://localhost:5174', 'https://vitacard365.com'],
  credentials: true
}));
app.use(express.json()); // <— IMPORTANTE

app.post('/api/mercadopago/preference', createMpPreference);

app.listen(3000, () => {
  console.log('API on :3000 | MP token present:', !!process.env.MP_ACCESS_TOKEN);
});
