import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configurado correctamente para credenciales
const allowedOrigins = [
  'https://vitacard365.com',
  'https://www.vitacard365.com',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_BASE_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origin (como Postman) en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar Mercado Pago
let mpClient = null;
let mpPreference = null;

try {
  const mpToken = process.env.MP_ACCESS_TOKEN;
  if (mpToken) {
    mpClient = new MercadoPagoConfig({ accessToken: mpToken });
    mpPreference = new Preference(mpClient);
    console.log('✅ Mercado Pago configurado correctamente');
    console.log('🔑 Token MP prefix:', mpToken.slice(0, 8));
  } else {
    console.log('❌ Token MP no encontrado en variables de entorno');
  }
} catch (error) {
  console.error('❌ Error configurando MP:', error.message);
}

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT,
    mpConfigured: !!mpPreference
  });
});

// Crear preferencia - ruta que coincide con el frontend
app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    if (!mpPreference) {
      throw new Error('Mercado Pago no configurado correctamente');
    }

    const { plan, frequency, familySize, unit_price } = req.body;
    
    console.log('📝 Datos recibidos:', { plan, frequency, familySize, unit_price });
    
    // Validar el monto - USAR EL VALOR DINÁMICO, NO HARDCODEADO
    const amount = Number(unit_price);
    if (!unit_price || isNaN(amount) || amount <= 0) {
      console.error('❌ Monto inválido recibido:', unit_price);
      return res.status(400).json({ 
        error: 'Monto inválido',
        received: unit_price,
        message: 'El monto debe ser un número mayor a 0'
      });
    }
    
    // Preparar datos para la preferencia
    const planName = plan || 'individual';
    const freq = frequency || 'monthly';
    const size = familySize || 1;
    
    const preferenceData = {
      items: [{
        title: `VitaCard365 - Plan ${planName} ${freq}`,
        description: `Plan ${planName} para ${size} ${size > 1 ? 'personas' : 'persona'}`,
        quantity: 1,
        unit_price: amount, // Usar el monto dinámico del frontend
        currency_id: 'MXN'
      }],
      back_urls: {
        success: `${process.env.FRONTEND_BASE_URL || 'http://localhost:5174'}/payment-gateway?from=mp`,
        failure: `${process.env.FRONTEND_BASE_URL || 'http://localhost:5174'}/payment-gateway?from=mp`,
        pending: `${process.env.FRONTEND_BASE_URL || 'http://localhost:5174'}/payment-gateway?from=mp`
      },
      auto_return: 'approved',
      notification_url: `${process.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
      metadata: {
        plan: planName,
        frequency: freq,
        family_size: size,
        amount: amount
      }
    };

    console.log('🚀 Creando preferencia con datos:', preferenceData);
    
    const response = await mpPreference.create({ body: preferenceData });
    
    console.log('✅ Preferencia creada exitosamente:', {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });
    
    // Retornar tanto el ID como las URLs de redirección
    res.json({
      preferenceId: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });
    
  } catch (error) {
    console.error('❌ Error creando preferencia:', {
      message: error.message,
      status: error.status,
      cause: error.cause
    });
    
    res.status(error.status || 500).json({
      error: 'Error al crear preferencia de pago',
      message: error.message,
      details: error.cause || 'Error interno del servidor'
    });
  }
});

// Webhook para notificaciones de Mercado Pago
app.post("/api/mercadopago/webhook", (req, res) => {
  console.log('📨 Webhook recibido:', req.body);
  res.status(200).send('OK');
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('🚨 Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor MP corriendo en puerto ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
