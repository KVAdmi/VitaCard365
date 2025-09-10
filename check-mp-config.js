require('dotenv').config();

console.log('====== Verificación de configuración de Mercado Pago ======');
console.log('');
console.log('Variables de entorno detectadas:');
console.log('---------------------------------');
console.log('MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'PRESENTE ✓' : 'AUSENTE ❌');
console.log('VITE_MP_PUBLIC_KEY:', process.env.VITE_MP_PUBLIC_KEY ? 'PRESENTE ✓' : 'AUSENTE ❌');
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL || 'AUSENTE ❌');
console.log('VITE_ENABLE_MP:', process.env.VITE_ENABLE_MP || 'AUSENTE (default: true)');
console.log('');

if (!process.env.MP_ACCESS_TOKEN) {
  console.error('❌ ERROR: No se encontró el token de acceso privado de Mercado Pago (MP_ACCESS_TOKEN)');
  console.error('   Agrega esta variable al archivo .env con tu token de Mercado Pago');
}

if (!process.env.VITE_MP_PUBLIC_KEY) {
  console.error('❌ ERROR: No se encontró la clave pública de Mercado Pago (VITE_MP_PUBLIC_KEY)');
  console.error('   Agrega esta variable al archivo .env con tu clave pública de Mercado Pago');
}

if (!process.env.VITE_API_BASE_URL) {
  console.warn('⚠️ ADVERTENCIA: No se encontró la URL base de la API (VITE_API_BASE_URL)');
  console.warn('   Se usará el valor predeterminado: http://localhost:3001');
}

console.log('');
console.log('Recuerda que:');
console.log('1. El servidor de MP debe ejecutarse en el puerto 3001');
console.log('2. La aplicación frontend debe apuntar al puerto 3001 para las APIs de MP');
console.log('3. Las variables deben estar definidas en el archivo .env');
console.log('');
console.log('Para iniciar el servidor de MP, ejecuta:');
console.log('   node server-mp.js');
console.log('');
console.log('====================================================');