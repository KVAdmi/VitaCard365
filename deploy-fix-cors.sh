#!/bin/bash

# ==========================================
# SCRIPT DE DESPLIEGUE - FIX CORS
# ==========================================

echo "🚀 Iniciando despliegue de corrección CORS..."

# Verificar que estamos en el directorio correcto
if [ ! -f "server-mp.js" ]; then
    echo "❌ Error: No se encontró server-mp.js. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Hacer backup del archivo actual
echo "📦 Creando backup del servidor actual..."
cp server-mp.js server-mp.js.backup.$(date +%Y%m%d_%H%M%S)

# Copiar configuración de producción
echo "⚙️ Configurando variables de entorno..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Configuración de producción aplicada"
else
    echo "⚠️ Advertencia: No se encontró .env.production"
fi

# Instalar dependencias si es necesario
echo "📦 Verificando dependencias..."
npm install

# Verificar que el puerto 3000 esté disponible
echo "🔍 Verificando puerto 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ El puerto 3000 está en uso. Deteniendo proceso..."
    pkill -f "node.*server-mp.js" || true
    sleep 2
fi

# Iniciar el servidor
echo "🚀 Iniciando servidor con configuración CORS corregida..."
echo "📍 Servidor disponible en: http://54.175.250.15:3000"
echo "🌐 Orígenes permitidos:"
echo "   - https://vitacard365.com"
echo "   - https://www.vitacard365.com"
echo "   - http://localhost:5174"
echo ""
echo "Para detener el servidor, presiona Ctrl+C"
echo "Para ejecutar en segundo plano: nohup node server-mp.js > server.log 2>&1 &"
echo ""

# Ejecutar servidor
node server-mp.js
