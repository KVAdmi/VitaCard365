#!/bin/bash
# Script para verificar que el servidor de Mercado Pago está funcionando correctamente
# Este script debe ejecutarse DENTRO de la instancia EC2 después de configurar el servidor

# Colores para mejor legibilidad
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Verificación del servidor de Mercado Pago ===${NC}"
echo ""

# Verificar si el servicio está activo
echo -e "${YELLOW}1. Verificando estado del servicio...${NC}"
if systemctl is-active --quiet mercadopago-server; then
  echo -e "${GREEN}✓ El servicio mercadopago-server está ACTIVO${NC}"
else
  echo -e "${RED}✗ El servicio mercadopago-server NO ESTÁ ACTIVO${NC}"
  echo "Intenta reiniciarlo con: sudo systemctl restart mercadopago-server"
fi

# Verificar si el puerto está abierto
echo -e "${YELLOW}2. Verificando puerto 3000...${NC}"
if netstat -tulpn 2>/dev/null | grep :3000 > /dev/null; then
  echo -e "${GREEN}✓ El puerto 3000 está ABIERTO y en uso${NC}"
else
  echo -e "${RED}✗ El puerto 3000 NO está abierto${NC}"
  echo "Verifica que el servicio esté funcionando correctamente"
fi

# Verificar healthcheck
echo -e "${YELLOW}3. Verificando endpoint /health...${NC}"
health_check=$(curl -s http://localhost:3000/health)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ El endpoint /health responde correctamente${NC}"
  echo "Respuesta: $health_check"
else
  echo -e "${RED}✗ No se pudo acceder al endpoint /health${NC}"
fi

# Verificar variables de entorno
echo -e "${YELLOW}4. Verificando variables de entorno...${NC}"
if grep -q "MP_ACCESS_TOKEN" ~/VitaCard365/.env; then
  echo -e "${GREEN}✓ Variable MP_ACCESS_TOKEN está configurada${NC}"
else
  echo -e "${RED}✗ Variable MP_ACCESS_TOKEN NO está configurada${NC}"
fi

if grep -q "VITE_MP_PUBLIC_KEY" ~/VitaCard365/.env; then
  echo -e "${GREEN}✓ Variable VITE_MP_PUBLIC_KEY está configurada${NC}"
else
  echo -e "${RED}✗ Variable VITE_MP_PUBLIC_KEY NO está configurada${NC}"
fi

# Verificar logs recientes
echo -e "${YELLOW}5. Mostrando logs recientes (últimas 10 líneas)...${NC}"
sudo journalctl -u mercadopago-server -n 10 --no-pager

echo ""
echo -e "${GREEN}Verificación completada${NC}"
echo ""
echo "Si todo está correcto, ahora puedes probar la integración desde tu frontend."
echo "Asegúrate de que tu aplicación esté configurada para usar:"
echo "VITE_API_BASE_URL=http://54.175.250.15:3000"
echo ""
echo "Para probar manualmente la creación de una preferencia:"
echo 'curl -X POST http://54.175.250.15:3000/api/mercadopago/preference -H "Content-Type: application/json" -d '"'"'{"plan":"Individual","frequency":"Mensual","amount":199}'"'"