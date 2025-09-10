#!/bin/bash
# Script para conectarse a la instancia EC2 de AWS
# Creado por GitHub Copilot

# Colores para mejor visibilidad
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando conexión SSH a la instancia AWS ===${NC}"

# Verificar si Git Bash está siendo utilizado
if [[ "$(uname -s)" != MINGW* ]] && [[ "$(uname -s)" != MSYS* ]]; then
  echo -e "${YELLOW}Este script está diseñado para Git Bash en Windows.${NC}"
  echo "Puede que algunas rutas necesiten ajustes en otros entornos."
fi

# Crear directorio .ssh si no existe
echo -e "${YELLOW}1. Creando directorio .ssh si no existe...${NC}"
mkdir -p ~/.ssh

# Determinar el nombre de usuario de Windows
WIN_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r')
echo "Usuario de Windows detectado: $WIN_USER"

# Copiar la clave a .ssh
echo -e "${YELLOW}2. Copiando la clave PEM a la carpeta .ssh...${NC}"
cp "/c/Users/$WIN_USER/Documents/KODIGO VIVO/Key/mercado-pago.pem" ~/.ssh/ 2>/dev/null

# Verificar si la copia fue exitosa
if [ $? -ne 0 ]; then
  echo "La ruta de la clave PEM puede ser incorrecta."
  echo "Por favor, ingresa la ruta completa a tu archivo mercado-pago.pem:"
  read KEY_PATH
  cp "$KEY_PATH" ~/.ssh/mercado-pago.pem
fi

# Establecer permisos correctos
echo -e "${YELLOW}3. Estableciendo permisos restrictivos (400) para la clave...${NC}"
chmod 400 ~/.ssh/mercado-pago.pem

# Crear archivo de configuración SSH
echo -e "${YELLOW}4. Creando/actualizando archivo de configuración SSH...${NC}"
if [ ! -f ~/.ssh/config ]; then
  touch ~/.ssh/config
  echo "Creando nuevo archivo de configuración SSH"
else
  echo "Actualizando archivo de configuración SSH existente"
fi

# Eliminar configuración existente para este host (si existe)
sed -i '/^Host mp-aws/,/^$/d' ~/.ssh/config

# Agregar nueva configuración
cat >> ~/.ssh/config << EOF
Host mp-aws
    HostName 54.175.250.15
    User ubuntu
    IdentityFile ~/.ssh/mercado-pago.pem
    ServerAliveInterval 60
    StrictHostKeyChecking no

EOF

echo -e "${GREEN}¡Configuración completada!${NC}"
echo ""
echo "Ahora puedes conectarte de dos formas:"
echo "1. Comando completo: ssh -i ~/.ssh/mercado-pago.pem ubuntu@54.175.250.15"
echo "2. Comando simplificado: ssh mp-aws"
echo ""
echo -e "${YELLOW}¿Deseas conectarte ahora? (s/n)${NC}"
read CONNECT

if [[ "$CONNECT" == "s" || "$CONNECT" == "S" || "$CONNECT" == "si" || "$CONNECT" == "SI" ]]; then
  echo -e "${GREEN}Conectando a la instancia EC2...${NC}"
  ssh mp-aws
else
  echo "Puedes conectarte más tarde ejecutando 'ssh mp-aws'"
fi