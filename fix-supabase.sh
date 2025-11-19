#!/bin/bash
# Archivo para verificar y corregir problemas de conexión con Supabase

# Colores para consola
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VitaCard365 - Solución de problemas de conexión ===${NC}"
echo ""

# Verificar si el archivo .env existe
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: No se encontró el archivo .env${NC}"
  echo "Creando archivo .env con la configuración correcta..."
else
  echo -e "${YELLOW}Encontrado archivo .env existente. Haciendo copia de seguridad...${NC}"
  cp .env .env.backup
  echo "Copia guardada como .env.backup"
fi

# Crear/actualizar el archivo .env con la configuración correcta
echo -e "${YELLOW}Creando archivo .env con la configuración correcta para Supabase...${NC}"
cat > .env << EOF
# Supabase (autenticación) - URL correcta con formato completo
VITE_SUPABASE_URL=https://ymwhgkeomyuevsckljdw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o

# Configuración para desarrollo local con Mercado Pago en AWS
PUBLIC_URL=http://localhost:5174
VITE_API_BASE_URL=http://54.175.250.15:3000
VITE_ENABLE_MP=true
VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
EOF

echo -e "${GREEN}✓ Archivo .env actualizado correctamente${NC}"

# Verificar y corregir supabaseClient.ts
SUPABASE_CLIENT="src/lib/supabaseClient.ts"
if [ -f "$SUPABASE_CLIENT" ]; then
  echo -e "${YELLOW}Verificando archivo $SUPABASE_CLIENT...${NC}"
  
  # Hacer copia de seguridad
  cp "$SUPABASE_CLIENT" "${SUPABASE_CLIENT}.backup"
  
  # Actualizar el archivo con la lógica corregida
  cat > "$SUPABASE_CLIENT" << EOF
import { supabase } from '@/lib/supabaseClient';

// Asegurar que la URL tenga el formato correcto (https://)
const urlRaw = import.meta.env.VITE_SUPABASE_URL;
const url = urlRaw?.startsWith('http') ? urlRaw : \`https://\${urlRaw}\`;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug completo
console.log('=== SUPABASE DEBUG ===');
console.log('VITE_SUPABASE_URL:', url);
console.log('VITE_SUPABASE_ANON_KEY:', anon ? 'present' : 'missing');
console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
console.log('=====================');

if (!url || !anon) {
  // Error claro y temprano (no pantalla en blanco con stack raro)
  throw new Error(
    \`[Supabase] Variables faltantes. VITE_SUPABASE_URL=\${String(url)} VITE_SUPABASE_ANON_KEY=\${anon ? 'present' : 'missing'}\`
  );
}

// exporta una sola instancia
export const supabase = supabase;
EOF
  
  echo -e "${GREEN}✓ Archivo $SUPABASE_CLIENT actualizado correctamente${NC}"
else
  echo -e "${RED}No se encontró el archivo $SUPABASE_CLIENT${NC}"
fi

echo ""
echo -e "${GREEN}=== Solución completada ===${NC}"
echo ""
echo -e "${YELLOW}Instrucciones para continuar:${NC}"
echo "1. Detén cualquier servidor en ejecución (Ctrl+C)"
echo "2. Ejecuta: npm run dev"
echo "3. Intenta iniciar sesión nuevamente"
echo ""
echo -e "${BLUE}Si sigues teniendo problemas, envía los logs de la consola del navegador${NC}"