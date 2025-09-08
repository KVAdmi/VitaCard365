import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Importa el endpoint de registro
import registerHandler from './auth/register.js';


// Monta el endpoint público de registro
app.post('/auth/register', registerHandler);


// Health check opcional
app.get('/api/health', (req, res) => res.json({ ok: true }));


// TODO: Montar y proteger endpoints core y billing con requirePaid

// Endpoint protegido para suscripciones
import billingSubscriptionsHandler from './api/billing/subscriptions.js';
app.post('/api/billing/subscriptions', billingSubscriptionsHandler);

const PORT = process.env.PORT || 5176;
app.listen(PORT, () => console.log(`Servidor VitaCard365 en http://localhost:${PORT}`));
