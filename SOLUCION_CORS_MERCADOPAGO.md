# Solución: Botón de Mercado Pago no aparece - Error CORS

## 🔍 Problema Identificado

El botón de Mercado Pago no aparecía en la pasarela de pago debido a un **error de CORS** que bloqueaba las solicitudes entre el frontend y el backend.

### Error Específico
```
Access to fetch at 'https://api.vitacard365.com/payments/preference' from origin 'https://vitacard365.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

### Causa Raíz
- **Frontend**: `https://vitacard365.com` haciendo solicitudes con `credentials: "include"`
- **Backend**: Configurado con `origin: '*'` en CORS
- **Conflicto**: Las reglas de CORS no permiten `origin: '*'` cuando se usan credenciales

## ✅ Solución Implementada

### 1. Configuración CORS Corregida (`server-mp.js`)

```javascript
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
```

### 2. Ruta de API Corregida

**Antes**: `/api/mercadopago/preference`
**Después**: `/payments/preference`

Esto coincide con la URL que usa el frontend: `${API_BASE}/payments/preference`

### 3. Archivos de Configuración

#### Backend (`.env.production`)
```env
PORT=3000
NODE_ENV=production
MP_ACCESS_TOKEN=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
FRONTEND_BASE_URL=https://vitacard365.com
PUBLIC_URL=http://54.175.250.15:3000
```

#### Frontend (`.env.frontend.production`)
```env
VITE_SUPABASE_URL=https://ymwhgkeomyuevsckljdw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE=https://api.vitacard365.com
VITE_ENABLE_MP=true
VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
```

## 🚀 Instrucciones de Despliegue

### Opción 1: Script Automático
```bash
./deploy-fix-cors.sh
```

### Opción 2: Manual

1. **Actualizar el servidor backend**:
   ```bash
   # Copiar configuración
   cp .env.production .env
   
   # Instalar dependencias
   npm install
   
   # Detener servidor actual (si está corriendo)
   pkill -f "node.*server-mp.js"
   
   # Iniciar servidor corregido
   node server-mp.js
   ```

2. **Actualizar el frontend** (si es necesario):
   ```bash
   # Asegurarse de que VITE_API_BASE apunte al servidor correcto
   # Reconstruir y redesplegar el frontend
   npm run build
   ```

## 🔧 Verificación

### 1. Verificar que el servidor esté corriendo
```bash
curl http://54.175.250.15:3000/health
```

**Respuesta esperada**:
```json
{
  "status": "OK",
  "timestamp": "2025-09-13T17:30:00.000Z",
  "port": 3000
}
```

### 2. Probar la creación de preferencia
```bash
curl -X POST http://54.175.250.15:3000/payments/preference \
  -H "Content-Type: application/json" \
  -H "Origin: https://vitacard365.com" \
  -d '{"plan":"Individual","frequency":"Mensual","amount":199}'
```

### 3. Verificar en el navegador
1. Abrir `https://vitacard365.com/payment-gateway`
2. Verificar que no hay errores de CORS en la consola
3. Confirmar que el botón de Mercado Pago aparece correctamente

## 📋 Checklist de Verificación

- [ ] Servidor backend corriendo en puerto 3000
- [ ] Configuración CORS permite `https://vitacard365.com`
- [ ] Ruta `/payments/preference` responde correctamente
- [ ] Frontend puede crear preferencias sin errores CORS
- [ ] Botón de Mercado Pago aparece en la pasarela de pago
- [ ] SDK de Mercado Pago se carga correctamente
- [ ] Wallet de Mercado Pago se inicializa sin errores

## 🔄 Próximos Pasos Recomendados

1. **Migrar a HTTPS**: Configurar SSL/TLS para el servidor backend
2. **Tokens de Producción**: Reemplazar tokens de prueba con tokens reales
3. **Monitoreo**: Implementar logs detallados para debugging
4. **Backup**: Configurar respaldos automáticos de la configuración

## 📞 Soporte

Si el problema persiste después de aplicar esta solución:

1. Verificar que las variables de entorno estén correctamente configuradas
2. Revisar los logs del servidor para errores específicos
3. Confirmar que el dominio frontend coincide exactamente con la configuración CORS
4. Verificar que el SDK de Mercado Pago se esté cargando correctamente

---

**Fecha de implementación**: 13 de septiembre de 2025
**Versión**: 1.0
**Estado**: ✅ Listo para despliegue
