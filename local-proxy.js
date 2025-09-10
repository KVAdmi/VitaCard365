// Para desarrollo local usando AWS como backend

// Importa las variables de entorno .env
const dotenv = require('dotenv');
dotenv.config();

// Configura el servidor proxy local
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Configura CORS para permitir solicitudes desde el frontend local
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Configura el proxy para redirigir las solicitudes a AWS
app.use('/api/mercadopago', createProxyMiddleware({
  target: 'http://54.175.250.15:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/mercadopago': '/api/mercadopago',
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxy: ${req.method} ${req.path} -> http://54.175.250.15:3000${req.path}`);
  }
}));

// Endpoint de healthcheck local
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    mode: 'proxy',
    target: 'http://54.175.250.15:3000',
    serverTime: new Date().toISOString()
  });
});

// Iniciar servidor local
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor proxy ejecutándose en http://localhost:${PORT}`);
  console.log('Redirigiendo solicitudes de Mercado Pago a http://54.175.250.15:3000');
  console.log('');
  console.log('Para desarrollo local, usa:');
  console.log('VITE_API_BASE_URL=http://localhost:3000');
});