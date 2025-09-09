require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_TOKEN) throw new Error('Falta MP_ACCESS_TOKEN en .env.local');
// Shim de compatibilidad v1/v2
if (typeof mercadopago.configure === 'function') {
  mercadopago.configure({ access_token: MP_TOKEN });
} else if (mercadopago.configurations && typeof mercadopago.configurations.setAccessToken === 'function') {
  mercadopago.configurations.setAccessToken(MP_TOKEN);
} else {
  mercadopago.access_token = MP_TOKEN;
}

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

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
    // Verificamos primero que tengamos el token
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('MP ERR: No se encontró MP_ACCESS_TOKEN en las variables de entorno');
      return res.status(500).json({ 
        error: 'mp_no_token', 
        detail: 'Falta configurar MP_ACCESS_TOKEN en .env.local' 
      });
    }
    
    console.log('MP: Creando preferencia con token que comienza con:', process.env.MP_ACCESS_TOKEN.substring(0, 10) + '...');
    
    const { plan='Individual', frequency='Mensual', amount=199 } = req.body || {};
    console.log('MP: Datos de preferencia:', { plan, frequency, amount });
    
    const { body } = await mercadopago.preferences.create({
      items: [{ title:`Vita365 ${plan} ${frequency}`, quantity:1, currency_id:'MXN', unit_price:Number(amount) }],
      back_urls: {
        success: `${process.env.PUBLIC_URL}/payment/success`,
        failure: `${process.env.PUBLIC_URL}/payment/failure`,
        pending: `${process.env.PUBLIC_URL}/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
    });
    
    console.log('MP: Preferencia creada con ID:', body.id);
    res.json({ preferenceId: body.id });
  } catch (e) {
    console.error('MP ERR:', e?.message);
    console.error('MP ERR detalles:', {
      name: e?.name,
      cause: e?.cause,
      stack: e?.stack?.split('\n').slice(0, 3).join(' | ')
    });
    res.status(500).json({ error: 'mp_pref_error', detail: e?.message });
  }
});

app.post('/api/mercadopago/webhook', (_req,res)=>res.sendStatus(200));

app.listen(3000, () => console.log('API ready on http://localhost:3000'));

// TODO: Montar y proteger endpoints core y billing con requirePaid
