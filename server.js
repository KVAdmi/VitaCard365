import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// CORS: pon aquí tu dominio del frontend en prod
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`API escuchando en :${PORT}`));
