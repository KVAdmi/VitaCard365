import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
// ...existing code...
// ...existing code...
// ...existing code...

// ...existing code...

// Crea una suscripción y devuelve el clientSecret del PaymentIntent asociado
app.post('/api/payments/create-subscription', async (req, res) => {
  try {
    console.log('create-subscription body:', req.body);
    const { email, priceId } = req.body;
    if (!email || !priceId) return res.status(400).json({ error: 'email y priceId requeridos' });

    // Busca o crea el customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }

    // Crea la suscripción
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;
    console.log('PaymentIntent status:', paymentIntent.status);
    console.log('PaymentIntent methods:', paymentIntent.payment_method_types);
    return res.json({ clientSecret: paymentIntent.client_secret, subscriptionId: subscription.id });
  } catch (err) {
    console.error('Error en create-subscription:', err);
    res.status(500).json({ error: err.message }); // Siempre responde JSON en error
  }
});
// ...existing code...
// ...existing code...
// ...existing code...

// ...existing code...

// Health check opcional
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Crea PaymentIntent y devuelve clientSecret
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'mxn', metadata = {} } = req.body || {};
    console.log('create-intent body:', req.body);
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      console.error('Error: amount requerido o inválido');
      return res.status(400).json({ error: { message: 'amount requerido o inválido' } });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Number(amount), // centavos
      currency,
      automatic_payment_methods: { enabled: true },
      metadata
    });

    return res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('create-intent error', err);
    return res.status(400).json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
