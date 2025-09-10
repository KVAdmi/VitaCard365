import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// CORS: pon aquí tu dominio del frontend en prod
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: process.env.FRONTEND_BASE_URL || 'http://localhost:5173', credentials: true }));


// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// Healthcheck
app.get("/health", (_req, res) => res.json({ 
  ok: true, 
  mp: !!process.env.MP_ACCESS_TOKEN
}));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`API escuchando en :${PORT}`));
