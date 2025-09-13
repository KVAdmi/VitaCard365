import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS simple
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    console.log('✅ Mercado Pago configurado');
  } else {
    console.log('❌ Token MP no encontrado');
  }
} catch (error) {
  console.error('❌ Error MP:', error.message);
}

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Crear preferencia
app.post("/api/mercadopago/preference", async (req, res) => {
  try {
    if (!mpPreference) {
      throw new Error('Mercado Pago no configurado');
    }

    const { plan = 'Individual', frequency = 'Mensual', amount = 199 } = req.body;
    
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
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Error al crear preferencia',
      message: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

export default app;

