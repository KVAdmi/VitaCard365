require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Health (debug rápido)
app.get('/api/mercadopago/health', (req, res) => {
  res.json({
    ok: true,
    hasToken: !!process.env.MP_ACCESS_TOKEN,
    publicUrl: process.env.PUBLIC_URL,
    time: new Date().toISOString(),
  });
});

// Preference (tu endpoint real)
app.post('/api/mercadopago/preference', async (req, res) => {
  try {
    const pref = await new Preference(mp).create({
      body: {
        items: [
          { title: 'Plan Individual Mensual', unit_price: 199, quantity: 1, currency_id: 'MXN' }
        ],
        auto_return: 'approved'
      }
    });

    // En v2, el id suele estar en pref.id (y también en pref.body.id según versión)
    const id = pref.id || pref.body?.id;
    if (!id) throw new Error('MP preference creation returned no id');

    res.json({ preferenceId: id });
  } catch (e) {
    console.error('MP 500:', {
      msg: e.message,
      name: e.name,
      cause: e.cause,
      error: e.error
    });
    res.status(500).json({ error: 'mp_pref_error', details: e.message, cause: e.cause || e.error });
  }
});

app.post('/api/mercadopago/webhook', (_req,res)=>res.sendStatus(200));

app.listen(3000, () => {
  console.log('API on :3000 | MP token present:', !!process.env.MP_ACCESS_TOKEN);
});

// TODO: Montar y proteger endpoints core y billing con requirePaid
