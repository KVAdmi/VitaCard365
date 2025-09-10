import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Load token from server/.env file
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
const mp = new MercadoPagoConfig({ accessToken: MP_TOKEN });

// Health (debug rápido)
app.get('/api/mercadopago/health', (req, res) => {
  res.json({
    ok: true,
    hasToken: !!MP_TOKEN,
    tokenSource: MP_TOKEN ? 'present' : 'missing',
    envToken: !!process.env.MP_ACCESS_TOKEN,
    publicUrl: process.env.PUBLIC_URL,
    time: new Date().toISOString(),
  });
});

// Preference endpoint with dynamic data
app.post('/api/mercadopago/preference', async (req, res) => {
  try {
    const { title, unit_price, currency_id = 'MXN' } = req.body;
    
    const preferenceData = {
      items: [
        { 
          title: title || 'Vita Mensual', 
          unit_price: Number(unit_price) || 199, 
          quantity: 1, 
          currency_id: currency_id 
        }
      ],
      back_urls: {
        success: 'https://vitacard365.netlify.app/success',
        failure: 'https://vitacard365.netlify.app/failure',
        pending: 'https://vitacard365.netlify.app/pending'
      },
      auto_return: 'approved',
      external_reference: `vita-${Date.now()}`,
      notification_url: 'https://vitacard365.netlify.app/webhook'
    };

    const pref = await new Preference(mp).create({ body: preferenceData });

    const id = pref.id || pref.body?.id;
    if (!id) throw new Error('MP preference creation returned no id');

    res.json({ 
      preferenceId: id,
      init_point: pref.init_point || pref.body?.init_point,
      success: true
    });
  } catch (e) {
    console.error('MP 500:', {
      msg: e.message,
      name: e.name,
      cause: e.cause,
      error: e.error
    });
    res.status(500).json({ 
      error: 'mp_pref_error', 
      details: e.message, 
      cause: e.cause || e.error 
    });
  }
});

app.post('/api/mercadopago/webhook', (_req,res)=>res.sendStatus(200));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API on :${PORT} | MP token present:`, !!MP_TOKEN);
  console.log('MP token source:', process.env.MP_ACCESS_TOKEN ? 'ENV' : 'HARDCODED');
});

// TODO: Montar y proteger endpoints core y billing con requirePaid
