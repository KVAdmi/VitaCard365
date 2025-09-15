import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mercadopago from 'mercadopago';
import path from 'path';
import { fileURLToPath } from 'url';
import notificationsRouter from './api/billing/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors({
  origin: "https://vitacard365.com",
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"]
}));
app.options('*', cors()); // preflight
app.use(express.json());

// Load token from server/.env file
mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

// Health (debug rápido)
app.get('/api/mercadopago/health', (req, res) => {
  res.json({
    ok: true,
    hasToken: !!process.env.MP_ACCESS_TOKEN,
    tokenSource: process.env.MP_ACCESS_TOKEN ? 'present' : 'missing',
    envToken: !!process.env.MP_ACCESS_TOKEN,
    publicUrl: process.env.PUBLIC_URL,
    time: new Date().toISOString(),
  });
});

// Preference endpoint with dynamic data
const FREQ_LABEL = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  semiannually: "Semestral",
  annually: "Anual",
};

app.use(express.json({ limit: "1mb" }));

app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    const { plan, frequency, familySize, unit_price } = req.body;
    // Asegura número con 2 decimales
    const price = Math.round(Number(unit_price) * 100) / 100;
    if (!price || price <= 0 || !isFinite(price)) {
      console.error("[MP] invalid price from FE:", unit_price);
      return res.status(400).json({ error: "invalid_price" });
    }
    const prefBody = {
      items: [{
        title: `VitaCard365 - ${plan} ${frequency}`,
        description: `plan=${plan}, freq=${frequency}, family=${familySize}`,
        quantity: 1,
        currency_id: 'MXN',
        unit_price: price,
      }],
      // ¡NO pongas purpose!
      external_reference: `VITA_${Date.now()}`,
      binary_mode: true,
      auto_return: 'approved',
      back_urls: {
        success: 'https://vitacard365.com/payment/success',
        failure: 'https://vitacard365.com/payment/failure',
        pending: 'https://vitacard365.com/payment/pending',
      },
      metadata: { plan, frequency, familySize, price }
    };
    // LOG para validar
    console.log("[MP] prefBody:", JSON.stringify(prefBody, null, 2));
    const mpRes = await mercadopago.preferences.create(prefBody);
    const { id: preferenceId, init_point } = mpRes.body;
    console.log("[MP] preferenceId:", preferenceId, "init_point:", init_point, "unit_price:", price);
    res.json({ preferenceId, init_point, price });
  } catch (err) {
    console.error("[MP] preference error:", err);
    return res.status(500).json({ error: "mp_error" });
  }
});

app.post('/api/mercadopago/webhook', (_req,res)=>res.sendStatus(200));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API on :${PORT} | MP token present:`, !!process.env.MP_ACCESS_TOKEN);
  console.log('MP token source:', process.env.MP_ACCESS_TOKEN ? 'ENV' : 'HARDCODED');
});

// Notificaciones push de vencimiento
app.use('/api/billing/notifications', notificationsRouter);
// TODO: Montar y proteger endpoints core y billing con requirePaid
