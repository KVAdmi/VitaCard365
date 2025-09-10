#!/bin/bash
# Script de inicio rápido para configurar Mercado Pago en AWS
# Este script configura todo lo necesario para ejecutar el servidor de Mercado Pago

# Colores para mejor legibilidad
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuración rápida del servidor de Mercado Pago ===${NC}"
echo ""

# Verificar si se está ejecutando como root o con sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Este script debe ejecutarse como root o con sudo${NC}"
  echo "Por favor ejecute: sudo bash $0"
  exit 1
fi

# Directorio de la aplicación
APP_DIR="/home/ubuntu/VitaCard365"

# 1. Actualizar el sistema
echo -e "${YELLOW}[1/7] Actualizando el sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar dependencias
echo -e "${YELLOW}[2/7] Instalando Node.js y otras dependencias...${NC}"
apt install -y nodejs npm git

# Verificar que Node.js está instalado correctamente
node_version=$(node -v)
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Node.js no se instaló correctamente${NC}"
  exit 1
else
  echo -e "${GREEN}Node.js $node_version instalado correctamente${NC}"
fi

# 3. Crear directorio de la aplicación si no existe
echo -e "${YELLOW}[3/7] Configurando directorio de la aplicación...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# 4. Clonar el repositorio o copiar los archivos (opcional)
echo -e "${YELLOW}[4/7] ¿Desea clonar el repositorio desde GitHub o copiar los archivos manualmente?${NC}"
echo "1) Clonar desde GitHub (necesita URL del repositorio)"
echo "2) Saltaré este paso y copiaré los archivos manualmente"
read -p "Opción (1/2): " clone_option

if [ "$clone_option" = "1" ]; then
  read -p "URL del repositorio Git: " repo_url
  git clone $repo_url .
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error al clonar el repositorio${NC}"
    echo "Continuando sin clonar..."
  fi
else
  echo -e "${YELLOW}Por favor copie manualmente los archivos a $APP_DIR${NC}"
  echo "Puede usar SCP o SFTP para transferir los archivos"
  echo "Presione Enter para continuar cuando esté listo..."
  read
fi

# 5. Configurar archivo .env
echo -e "${YELLOW}[5/7] Configurando variables de entorno...${NC}"
if [ ! -f ".env" ]; then
  echo "Creando archivo .env..."
  cat > .env << EOF
# Configuración para servidor de Mercado Pago en AWS
PORT=3000
NODE_ENV=production

# URLs - Usando la IP pública de esta instancia
PUBLIC_URL=http://3.149.144.140
VITE_API_BASE_URL=http://3.149.144.140

# Mercado Pago
VITE_ENABLE_MP=true
VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
MP_ACCESS_TOKEN=TEST-7252932723780357-090909-7dff05cc5fbb6a50bfe7b952c2f674bd-1592695082

# Configuración CORS - Permitir acceso desde localhost durante pruebas
ALLOWED_ORIGINS=http://localhost:5173,http://3.149.144.140
EOF
  echo -e "${GREEN}Archivo .env creado${NC}"
else
  echo -e "${YELLOW}El archivo .env ya existe. Asegúrese de que contenga las variables correctas.${NC}"
fi

# 6. Instalar dependencias de npm
echo -e "${YELLOW}[6/7] Instalando dependencias de Node.js...${NC}"
npm install express cors mercadopago dotenv

# 7. Configurar el servicio de systemd
echo -e "${YELLOW}[7/7] Configurando el servicio systemd...${NC}"

if [ ! -f "/etc/systemd/system/mercadopago-server.service" ]; then
  cat > /etc/systemd/system/mercadopago-server.service << EOF
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

  systemctl daemon-reload
  systemctl enable mercadopago-server
  systemctl start mercadopago-server
  
  echo -e "${GREEN}Servicio systemd configurado y iniciado${NC}"
else
  echo -e "${YELLOW}El archivo de servicio ya existe. Reiniciando servicio...${NC}"
  systemctl restart mercadopago-server
fi

# Verificar el estado del servicio
echo ""
echo -e "${YELLOW}Verificando el estado del servicio...${NC}"
systemctl status mercadopago-server --no-pager

# Información final
echo ""
echo -e "${GREEN}¡Configuración completada!${NC}"
echo -e "El servidor de Mercado Pago está corriendo en http://3.149.144.140:3000"
echo -e "Puede verificar el estado con: ${YELLOW}systemctl status mercadopago-server${NC}"
echo -e "Ver los logs con: ${YELLOW}journalctl -u mercadopago-server -f${NC}"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC} No olvide configurar su frontend para usar la URL: ${GREEN}http://3.149.144.140${NC}"
echo "Y recuerde CAMBIAR las credenciales de AWS después de realizar las pruebas."