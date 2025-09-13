// Script para despliegue en AWS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Para depuración: mostrar las variables de entorno cargadas
console.log('Variables de entorno cargadas:');
console.log('MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'PRESENTE (primeros 8 caracteres: ' + process.env.MP_ACCESS_TOKEN.substring(0, 8) + ')' : 'AUSENTE');
console.log('VITE_MP_PUBLIC_KEY:', process.env.VITE_MP_PUBLIC_KEY ? 'PRESENTE' : 'AUSENTE');
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL || 'AUSENTE');

const app = express();

// Configuración mejorada de CORS para producción
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://3.149.144.140').split(',');
console.log('CORS configurado para los orígenes:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf('*') !== -1) {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
  // callback(new Error('No permitido por CORS')); // Deshabilitado por CORS universal
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Inicializar Mercado Pago con mejor manejo de errores
console.log('Iniciando servidor de Mercado Pago...');
let mpClient;
let mpPreference;

try {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no está configurado en variables de entorno');
  }
  
  console.log('MP TOKEN PREFIX:', process.env.MP_ACCESS_TOKEN.slice(0, 8));
  mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  mpPreference = new Preference(mpClient);
  console.log('Cliente de Mercado Pago inicializado correctamente');
} catch (error) {
  console.error('ERROR AL INICIALIZAR MERCADO PAGO:', error);
  process.exit(1); // Terminar el proceso si hay error crítico
}

// Healthcheck / Status endpoint
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mp: !!process.env.MP_ACCESS_TOKEN,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString()
  });
});

// Endpoint para crear preferencias de pago
app.post('/api/mercadopago/preference', async (req, res) => {
  try {
    console.log('Recibida solicitud de preferencia MP:', req.body);
    const { plan = 'Individual', frequency = 'Mensual', amount = 199 } = req.body || {};

    // URLs base para callbacks - usando la IP de AWS para pruebas
    const baseURL = process.env.PUBLIC_URL || 'http://3.149.144.140';
    
    // Para pruebas, podemos usar el localhost como URL de retorno si lo solicitó el localhost
    const originHeader = req.headers.origin;
    const successUrl = originHeader && originHeader.includes('localhost') 
      ? `${originHeader}/payment/success`
      : `${baseURL}/payment/success`;
    
    const body = {
      items: [{
        title: `Vita365 ${String(plan)} ${String(frequency)}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'MXN',
      }],
      back_urls: {
        success: successUrl,
        failure: `${baseURL}/payment/failure`,
        pending: `${baseURL}/payment/pending`,
      },
      auto_return: 'approved',
      // URL de webhook para recibir notificaciones de MP
      notification_url: `${process.env.VITE_API_BASE_URL || 'http://3.149.144.140'}/api/mercadopago/webhook`,
    };

    console.log('Creando preferencia con:', JSON.stringify(body, null, 2));
    const resp = await mpPreference.create({ body });
    const pid = resp?.id || resp?.body?.id;

    if (!pid) throw new Error('No se pudo obtener el ID de preferencia');
    
    console.log('Preferencia creada con éxito:', pid);
    res.json({ 
      preferenceId: pid,
      sandbox: process.env.NODE_ENV !== 'production'
    });
  } catch (e) {
    // Log detallado para diagnosticar
    console.error('MP PREFERENCE ERROR →', {
      status: e?.status,
      message: e?.message,
      name: e?.name,
      cause: e?.cause,
      stack: e?.stack?.split('\n').slice(0, 3).join(' | ')
    });
    const status = e?.status || 500;
    res.status(status).json({ error: 'mp_pref_error', detail: e?.message, cause: e?.cause });
  }
});

// Webhook para recibir notificaciones de pagos
app.post('/api/mercadopago/webhook', async (req, res) => {
  try {
    console.log('Webhook de MP recibido:', req.body);
    // Aquí procesarías las notificaciones de pago
    // Típicamente verificas la acción, el estado del pago, y actualizas tu base de datos
    
    // Ejemplo de procesamiento básico
    const { action, data } = req.body;
    
    if (action === 'payment.created' || action === 'payment.updated') {
      // TODO: Actualizar el estado de la suscripción en tu base de datos
      console.log(`Pago ${data.id} procesado correctamente`);
    }
    
    res.status(200).send('OK');
  } catch (e) {
    console.error('Error en webhook MP:', e);
    res.status(500).send('Error');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de Mercado Pago escuchando en puerto :${PORT}`);
  console.log(`MP Token configurado: ${!!process.env.MP_ACCESS_TOKEN}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('Servidor listo para procesar pagos');
});