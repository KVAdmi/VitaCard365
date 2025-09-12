import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Cargar variables de entorno
dotenv.config();

console.log('🚀 VITACARD365 - SERVIDOR MERCADO PAGO');
console.log('=====================================');

const app = express();

// ==========================================
// CONFIGURACIÓN CRÍTICA
// ==========================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5174';

console.log(`📍 Host: ${HOST}`);
console.log(`🔌 Puerto: ${PORT}`);
console.log(`🌍 Entorno: ${NODE_ENV}`);
console.log(`🖥️ Frontend URL: ${FRONTEND_BASE_URL}`);

// ==========================================
// CORS CONFIGURATION
// ==========================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://vitacard365.com',
  'https://www.vitacard365.com',
  'https://vitacard365.netlify.app',
  FRONTEND_BASE_URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Manejar preflight OPTIONS
app.options('*', cors());

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No origin'}`);
  next();
});

// ==========================================
// INICIALIZACIÓN MERCADO PAGO
// ==========================================
let mpClient = null;
let mpPreference = null;
let mpConfigured = false;
let mpTokenPrefix = '';

try {
  const mpToken = process.env.MP_ACCESS_TOKEN;
  
  if (!mpToken) {
    console.error('❌ ERROR: MP_ACCESS_TOKEN no está configurado en .env');
    throw new Error('MP_ACCESS_TOKEN no configurado');
  }
  
  // Mostrar prefijo del token para debugging (sin exponer el token completo)
  mpTokenPrefix = mpToken.substring(0, 20) + '...';
  console.log(`✅ MP TOKEN PREFIX: ${mpTokenPrefix}`);
  
  // Inicializar cliente de Mercado Pago
  mpClient = new MercadoPagoConfig({ 
    accessToken: mpToken,
    options: {
      timeout: 5000,
      idempotencyKey: 'vitacard365'
    }
  });
  
  mpPreference = new Preference(mpClient);
  mpConfigured = true;
  
  console.log('✅ Mercado Pago inicializado correctamente');
  
} catch (error) {
  console.error('❌ Error inicializando Mercado Pago:', error.message);
  mpConfigured = false;
}

// ==========================================
// RUTAS
// ==========================================

// Health check completo
app.get("/health", (req, res) => {
  const healthData = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    server: {
      port: PORT,
      host: HOST,
      node_version: process.version
    },
    mercadopago: {
      configured: mpConfigured,
      client_ready: mpClient !== null,
      token_present: !!process.env.MP_ACCESS_TOKEN
    },
    environment: {
      node_env: NODE_ENV,
      frontend_url: FRONTEND_BASE_URL
    }
  };
  
  console.log('✅ Health check solicitado');
  res.status(200).json(healthData);
});

// Crear preferencia de pago
app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    console.log('💰 Creando preferencia de pago...');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    
    if (!mpConfigured) {
      throw new Error('Mercado Pago no está configurado correctamente');
    }

    if (!mpPreference) {
      throw new Error('Cliente de Mercado Pago no está inicializado');
    }

    const { plan = 'Individual', frequency = 'Mensual', amount = 199 } = req.body;
    
    // Validar amount
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error(`Monto inválido: ${amount}`);
    }

    const preferenceData = {
      items: [{
        id: `vitacard365-${plan.toLowerCase()}-${frequency.toLowerCase()}`,
        title: `VitaCard365 - Plan ${plan} ${frequency}`,
        description: `Suscripción ${frequency.toLowerCase()} al plan ${plan} de VitaCard365`,
        quantity: 1,
        unit_price: numericAmount,
        currency_id: 'MXN'
      }],
      back_urls: {
        success: `${FRONTEND_BASE_URL}/payment/success`,
        failure: `${FRONTEND_BASE_URL}/payment/failure`,
        pending: `${FRONTEND_BASE_URL}/payment/pending`
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      notification_url: `${process.env.PUBLIC_URL || 'http://54.175.250.15:3000'}/api/mercadopago/webhook`,
      statement_descriptor: 'VITACARD365',
      external_reference: `vitacard365-${Date.now()}`
    };

    console.log('🔄 Enviando preferencia a Mercado Pago...');
    const response = await mpPreference.create({ body: preferenceData });
    
    console.log('✅ Preferencia creada exitosamente');
    console.log(`🆔 Preference ID: ${response.id}`);
    
    const responseData = {
      preferenceId: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      created: response.date_created,
      expires: response.expiration_date_to
    };
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Error creando preferencia:', error);
    
    const errorResponse = {
      error: 'Error al crear preferencia de pago',
      message: error.message,
      timestamp: new Date().toISOString(),
      details: {
        mp_configured: mpConfigured,
        mp_client_ready: mpClient !== null,
        token_present: !!process.env.MP_ACCESS_TOKEN
      }
    };
    
    res.status(500).json(errorResponse);
  }
});

// Webhook de Mercado Pago (para notificaciones de pago)
app.post("/api/mercadopago/webhook", (req, res) => {
  console.log('🔔 Webhook recibido de Mercado Pago');
  console.log('📦 Webhook data:', JSON.stringify(req.body, null, 2));
  
  // Aquí puedes procesar las notificaciones de pago
  // Por ahora solo loggeamos y respondemos OK
  
  res.status(200).send('OK');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const server = app.listen(PORT, HOST, () => {
  console.log('=====================================');
  console.log(`🚀 SERVIDOR INICIADO EXITOSAMENTE`);
  console.log(`📍 URL: http://${HOST}:${PORT}`);
  console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`💰 Mercado Pago: ${mpConfigured ? '✅ Configurado' : '❌ No configurado'}`);
  console.log('=====================================');
});

// Manejo graceful de cierre
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

export default app;

