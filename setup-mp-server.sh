#!/bin/bash
# Script para configurar Mercado Pago en la instancia EC2
# Este script debe ejecutarse DENTRO de la instancia EC2 después de conectarse por SSH

# Colores para mejor legibilidad
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuración del servidor de Mercado Pago en AWS ===${NC}"
echo ""

# Crear directorios
echo -e "${YELLOW}1. Creando estructura de directorios...${NC}"
mkdir -p ~/VitaCard365

# Cambiar al directorio de trabajo
cd ~/VitaCard365

# Crear archivo .env
echo -e "${YELLOW}2. Configurando variables de entorno...${NC}"
cat > .env << EOF
# Configuración para servidor de Mercado Pago en AWS
PORT=3000
NODE_ENV=production

# URLs - Usando la IP pública de esta instancia
PUBLIC_URL=http://54.175.250.15
VITE_API_BASE_URL=http://54.175.250.15

# Mercado Pago
VITE_ENABLE_MP=true
VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
MP_ACCESS_TOKEN=TEST-7252932723780357-090909-7dff05cc5fbb6a50bfe7b952c2f674bd-1592695082

# Configuración CORS - Permitir acceso desde localhost durante pruebas
ALLOWED_ORIGINS=http://localhost:5173,http://54.175.250.15,*
EOF

# Crear archivo deploy-aws.js
echo -e "${YELLOW}3. Creando script del servidor...${NC}"
cat > deploy-aws.js << EOF
// Script para despliegue en AWS
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Para depuración: mostrar las variables de entorno cargadas
console.log('Variables de entorno cargadas:');
console.log('MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'PRESENTE' : 'AUSENTE');
console.log('VITE_MP_PUBLIC_KEY:', process.env.VITE_MP_PUBLIC_KEY ? 'PRESENTE' : 'AUSENTE');
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL || 'AUSENTE');

// Configuración de CORS
app.use(cors({
  origin: '*',  // Permitir cualquier origen para pruebas
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parseo de JSON
app.use(express.json());

// Endpoint de estado/healthcheck
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    mp: !!process.env.MP_ACCESS_TOKEN,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString()
  });
});

// Endpoint para crear preferencias de pago de Mercado Pago
app.post('/api/mercadopago/preference', async (req, res) => {
  try {
    console.log('Recibida solicitud de preferencia MP:', req.body);
    const { plan = 'Individual', frequency = 'Mensual', amount = 199 } = req.body || {};

    // Intentamos cargar MercadoPago
    let mercadopago;
    try {
      mercadopago = require('mercadopago');
      mercadopago.configure({
        access_token: process.env.MP_ACCESS_TOKEN
      });
    } catch (mpError) {
      console.error('Error al configurar MercadoPago:', mpError);
      return res.status(500).json({ error: 'mp_config_error', detail: mpError.message });
    }

    // URLs base para callbacks
    const baseURL = process.env.PUBLIC_URL || 'http://54.175.250.15';
    
    // Para pruebas, usar el origen de la petición como URL de retorno si proviene de localhost
    const originHeader = req.headers.origin;
    const successUrl = originHeader && originHeader.includes('localhost') 
      ? \`\${originHeader}/payment/success\`
      : \`\${baseURL}/payment/success\`;
    
    const preference = {
      items: [{
        title: \`Vita365 \${String(plan)} \${String(frequency)}\`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'MXN',
      }],
      back_urls: {
        success: successUrl,
        failure: \`\${baseURL}/payment/failure\`,
        pending: \`\${baseURL}/payment/pending\`,
      },
      auto_return: 'approved',
      notification_url: \`\${process.env.VITE_API_BASE_URL || 'http://54.175.250.15'}/api/mercadopago/webhook\`,
    };

    console.log('Creando preferencia con:', JSON.stringify(preference, null, 2));
    
    const result = await mercadopago.preferences.create(preference);
    console.log('Preferencia creada con éxito:', result.body.id);
    
    res.json({ 
      preferenceId: result.body.id,
      sandbox: process.env.NODE_ENV !== 'production'
    });
  } catch (e) {
    console.error('MP PREFERENCE ERROR →', {
      status: e?.status,
      message: e?.message,
      name: e?.name,
      cause: e?.cause,
      stack: e?.stack?.split('\\n').slice(0, 3).join(' | ')
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
    res.status(200).send('OK');
  } catch (e) {
    console.error('Error en webhook MP:', e);
    res.status(500).send('Error');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`API de Mercado Pago escuchando en puerto :\${PORT}\`);
  console.log(\`MP Token configurado: \${!!process.env.MP_ACCESS_TOKEN}\`);
  console.log(\`Entorno: \${process.env.NODE_ENV || 'development'}\`);
  console.log('Servidor listo para procesar pagos');
  console.log(\`Abre http://54.175.250.15:\${PORT}/health para verificar que el servidor está funcionando\`);
});
EOF

# Crear archivo de servicio systemd
echo -e "${YELLOW}4. Creando archivo de servicio systemd...${NC}"
cat > mercadopago-server.service << EOF
[Unit]
Description=Mercado Pago Server for VitaCard365
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/VitaCard365
ExecStart=/usr/bin/node deploy-aws.js
Restart=always
Environment=NODE_ENV=production

# Logs
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Instalar dependencias
echo -e "${YELLOW}5. Actualizando el sistema e instalando dependencias...${NC}"
sudo apt update
sudo apt install -y nodejs npm

# Instalar dependencias de Node.js
echo -e "${YELLOW}6. Instalando dependencias de Node.js...${NC}"
npm init -y
npm install express cors dotenv mercadopago

# Configurar el servicio systemd
echo -e "${YELLOW}7. Configurando el servicio systemd...${NC}"
sudo cp mercadopago-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mercadopago-server
sudo systemctl start mercadopago-server

# Verificar el estado
echo -e "${YELLOW}8. Verificando el estado del servicio...${NC}"
sudo systemctl status mercadopago-server --no-pager

# Verificar acceso al puerto
echo -e "${YELLOW}9. Verificando que el puerto 3000 esté abierto...${NC}"
if which netstat > /dev/null; then
  netstat -tulpn | grep :3000
else
  echo "El comando netstat no está disponible. Instalando..."
  sudo apt install -y net-tools
  netstat -tulpn | grep :3000
fi

# Información final
echo ""
echo -e "${GREEN}¡Configuración completada!${NC}"
echo ""
echo "Información importante:"
echo "- El servidor de Mercado Pago está configurado y ejecutándose"
echo "- URL base de la API: http://54.175.250.15:3000"
echo "- Endpoint para healthcheck: http://54.175.250.15:3000/health"
echo "- Endpoint para crear preferencias: http://54.175.250.15:3000/api/mercadopago/preference"
echo ""
echo "Para ver los logs en tiempo real:"
echo "sudo journalctl -u mercadopago-server -f"
echo ""
echo "Para reiniciar el servicio:"
echo "sudo systemctl restart mercadopago-server"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC} Asegúrate de que el puerto 3000 esté abierto en el grupo de seguridad de AWS."