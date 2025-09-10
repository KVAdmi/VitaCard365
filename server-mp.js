import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import { Router } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// CORS: Configuración mejorada
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ 
  origin: process.env.FRONTEND_BASE_URL || 'http://localhost:5173', 
  credentials: true 
}));

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

// Inicializar Mercado Pago
console.log('MP TOKEN PREFIX:', (process.env.MP_ACCESS_TOKEN||'').slice(0,8));
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const mpPreference = new Preference(mpClient);

// Healthcheck
app.get("/health", (_req, res) => res.json({ 
  ok: true, 
  mp: !!process.env.MP_ACCESS_TOKEN,
  stripe: !!process.env.STRIPE_SECRET_KEY
}));

// Endpoint de Stripe
app.post("/api/payments/create-intent", async (req, res) => {
  try {
    const { amount, currency = "mxn" } = req.body;
    if (!amount) return res.status(400).json({ error: "amount requerido" });

    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de Mercado Pago
app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    console.log('Recibida solicitud de preferencia MP:', req.body);
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
      notification_url: `${process.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/mercadopago/webhook`,
    };

    console.log('Creando preferencia con:', JSON.stringify(body, null, 2));
    const resp = await mpPreference.create({ body });
    const pid = resp?.id || resp?.body?.id;
    
    if (!pid) throw new Error('no_pref_id');
    console.log('Preferencia creada con éxito:', pid);
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

// Webhook de Mercado Pago
app.post("/api/mercadopago/webhook", async (req, res) => {
  try {
    console.log('Webhook de MP recibido:', req.body);
    // Aquí procesarías las notificaciones de pago de MP
    
    res.status(200).send('OK');
  } catch (e) {
    console.error('Error en webhook MP:', e);
    res.status(500).send('Error');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto :${PORT}`);
  console.log(`MP Token presente: ${!!process.env.MP_ACCESS_TOKEN}`);
  console.log(`Stripe Key presente: ${!!process.env.STRIPE_SECRET_KEY}`);
  console.log(`URL frontend: ${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}`);
});