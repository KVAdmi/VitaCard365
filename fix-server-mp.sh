#!/bin/bash
# Detener el proceso actual de PM2
pm2 delete vitacard365-mp

# Reemplazar el archivo corrupto con el nuevo
cat > server-mp.js << 'EOL'
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Cargar variables de entorno
dotenv.config();

const app = express();

// CORS universal y simple (antes de cualquier otra configuración)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Manejar preflight OPTIONS
app.options('*', cors());

// Parseo de JSON y URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CONFIGURACIÓN CRÍTICA
// ==========================================
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ==========================================
// INICIALIZACIÓN MERCADO PAGO
// ==========================================
let mpClient = null;
let mpPreference = null;
let mpConfigured = false;

try {
  const mpToken = process.env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    console.error('❌ ERROR: MP_ACCESS_TOKEN no está configurado en .env');
  } else {
    mpClient = new MercadoPagoConfig({ accessToken: mpToken });
    mpPreference = new Preference(mpClient);
    mpConfigured = true;
    console.log('✅ Mercado Pago inicializado correctamente');
  }
} catch (error) {
  console.error('❌ Error inicializando Mercado Pago:', error.message);
}

// ==========================================
// RUTAS
// ==========================================

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Crear preferencia de pago
app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    if (!mpConfigured) {
      throw new Error('Mercado Pago no está configurado');
    }

    const { plan, frequency, amount } = req.body;
    const preference = {
      items: [{
        title: `VitaCard365 - Plan ${plan} ${frequency}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'MXN'
      }],
      back_urls: {
        success: `${process.env.FRONTEND_BASE_URL}/payment/success`,
        failure: `${process.env.FRONTEND_BASE_URL}/payment/failure`
      },
      auto_return: 'approved'
    };

    const response = await mpPreference.create({ body: preference });
    res.json({
      preferenceId: response.id,
      init_point: response.init_point
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error al crear preferencia',
      message: error.message
    });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
});
EOL

# Iniciar el servidor nuevamente con PM2
pm2 start server-mp.js --name vitacard365-mp