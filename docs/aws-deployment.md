# Despliegue de la pasarela de Mercado Pago en AWS

Este documento proporciona instrucciones para desplegar y configurar la pasarela de pago de Mercado Pago en un servidor AWS.

## Requisitos previos

1. Una instancia EC2 o similar en AWS con acceso SSH
2. Node.js (v14 o superior) y npm instalados
3. Una cuenta de desarrollador en Mercado Pago con credenciales
4. Dominio configurado con DNS (opcional, pero recomendado)

## Pasos de instalación

### 1. Preparar el servidor

Conectarse por SSH a tu instancia y actualizar el sistema:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git -y
```

### 2. Clonar el repositorio

```bash
git clone https://github.com/TuUsuario/VitaCard365.git
cd VitaCard365
```

### 3. Configurar variables de entorno

Crear un archivo .env en la raíz del proyecto:

```bash
nano .env
```

Añadir las siguientes variables (ajusta los valores según tu configuración):

```
# Configuración general
PORT=3000
NODE_ENV=production

# URLs
PUBLIC_URL=https://tu-dominio-frontend.com
VITE_API_BASE_URL=https://tu-dominio-o-ip-aws.com

# Mercado Pago
VITE_ENABLE_MP=true
VITE_MP_PUBLIC_KEY=TU_CLAVE_PUBLICA_MP
MP_ACCESS_TOKEN=TU_TOKEN_PRIVADO_MP
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Configurar el servidor como servicio

Crear un archivo de servicio systemd:

```bash
sudo nano /etc/systemd/system/mercadopago-server.service
```

Añadir la siguiente configuración:

```
[Unit]
Description=Mercado Pago Server for VitaCard365
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/ruta/a/VitaCard365
ExecStart=/usr/bin/node deploy-aws.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Iniciar y habilitar el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl start mercadopago-server
sudo systemctl enable mercadopago-server
```

### 6. Configurar Nginx como proxy inverso (recomendado)

Instalar Nginx:

```bash
sudo apt install nginx -y
```

Crear configuración de sitio:

```bash
sudo nano /etc/nginx/sites-available/mercadopago-api
```

Añadir la siguiente configuración:

```
server {
    listen 80;
    server_name tu-dominio-o-ip-aws.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar el sitio y reiniciar Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/mercadopago-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configurar HTTPS con Certbot (recomendado)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio-o-ip-aws.com
```

## Verificación del despliegue

Para verificar que la API está funcionando correctamente:

1. Visita `https://tu-dominio-o-ip-aws.com/health` - Deberías ver un JSON con `{"ok": true, ...}`

2. Prueba el endpoint de preferencia con curl:

```bash
curl -X POST https://tu-dominio-o-ip-aws.com/api/mercadopago/preference \
  -H "Content-Type: application/json" \
  -d '{"plan":"Individual","frequency":"Mensual","amount":199}'
```

## Configuración en el frontend

Asegúrate de que el frontend esté configurado para usar la URL de tu API en AWS:

1. Actualiza la variable de entorno `VITE_API_BASE_URL` en el frontend para que apunte a tu servidor AWS.

2. Reconstruye el frontend con `npm run build` y despliégalo en tu servidor de producción.

## Solución de problemas

Si encuentras problemas, verifica:

1. Los logs del servidor:
   ```bash
   sudo journalctl -u mercadopago-server -f
   ```

2. Los logs de Nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Confirma que los puertos no están bloqueados por el grupo de seguridad de AWS o el firewall.

## Actualización del servidor

Para actualizar el servidor con nuevos cambios:

```bash
cd /ruta/a/VitaCard365
git pull
npm install
sudo systemctl restart mercadopago-server
```