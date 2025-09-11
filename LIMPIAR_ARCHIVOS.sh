#!/bin/bash

# ==========================================
# SCRIPT PARA LIMPIAR ARCHIVOS DUPLICADOS
# ==========================================

echo "🧹 ========================================"
echo "🧹 LIMPIANDO ARCHIVOS DUPLICADOS"
echo "🧹 ========================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==========================================
# PASO 1: HACER BACKUP
# ==========================================

log_info "Creando backup de archivos importantes..."

# Crear directorio de backup
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Backup de archivos importantes
cp server-mp.js "$BACKUP_DIR/server-mp-original.js" 2>/dev/null || log_warning "server-mp.js no encontrado"
cp server.js "$BACKUP_DIR/server-original.js" 2>/dev/null || log_warning "server.js no encontrado"
cp .env "$BACKUP_DIR/env-backup" 2>/dev/null || log_warning ".env no encontrado"

log_success "Backup creado en: $BACKUP_DIR"

# ==========================================
# PASO 2: LISTAR ARCHIVOS A ELIMINAR
# ==========================================

log_info "Archivos que serán eliminados:"

# Archivos de servidor duplicados/innecesarios
FILES_TO_DELETE=(
    "server.js"
    "test-mp.js"
    "test-server.js"
    "check-mp-config.js"
    "start-server.bat"
    "start-mp-server.bat"
    "update_mp_token.txt"
)

# Mostrar archivos que existen y serán eliminados
for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        echo "  ❌ $file"
    fi
done

# ==========================================
# PASO 3: CONFIRMAR ELIMINACIÓN
# ==========================================

echo ""
read -p "¿Continuar con la limpieza? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Operación cancelada por el usuario"
    exit 0
fi

# ==========================================
# PASO 4: ELIMINAR ARCHIVOS DUPLICADOS
# ==========================================

log_info "Eliminando archivos duplicados..."

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        log_success "Eliminado: $file"
    fi
done

# ==========================================
# PASO 5: RENOMBRAR ARCHIVO FINAL
# ==========================================

log_info "Configurando archivo principal..."

# Renombrar el archivo final como el principal
if [ -f "server-mp-FINAL.js" ]; then
    mv "server-mp-FINAL.js" "server-mp.js"
    log_success "server-mp-FINAL.js → server-mp.js"
else
    log_error "server-mp-FINAL.js no encontrado"
fi

# ==========================================
# PASO 6: LIMPIAR DIRECTORIO SERVER (OPCIONAL)
# ==========================================

log_info "¿Deseas limpiar también el directorio 'server'?"
echo "Este directorio contiene archivos adicionales que podrían no ser necesarios"

read -p "¿Eliminar directorio 'server'? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "server" ]; then
        # Hacer backup del directorio server
        cp -r server "$BACKUP_DIR/server-backup"
        rm -rf server
        log_success "Directorio 'server' eliminado (backup en $BACKUP_DIR)"
    fi
fi

# ==========================================
# PASO 7: VERIFICAR ARCHIVOS RESTANTES
# ==========================================

log_info "Archivos relacionados con servidor restantes:"

ls -la | grep -E "(server|mp|\.js$)" | while read line; do
    echo "  ✅ $line"
done

# ==========================================
# PASO 8: CREAR ARCHIVO DE CONFIGURACIÓN
# ==========================================

log_info "Creando archivo de configuración recomendado..."

cat > .env.template << 'EOF'
# ==========================================
# CONFIGURACIÓN VITACARD365 - MERCADO PAGO
# ==========================================

# Puerto del servidor (DEBE ser 3000)
PORT=3000

# Entorno de ejecución
NODE_ENV=production

# ==========================================
# MERCADO PAGO
# ==========================================

# Token de acceso (REEMPLAZAR con tu token real)
MP_ACCESS_TOKEN=TEST-tu-token-de-mercado-pago-aqui

# ==========================================
# URLS
# ==========================================

# URL del frontend
FRONTEND_BASE_URL=http://localhost:5174

# URL pública del servidor
PUBLIC_URL=http://54.175.250.15:3000

# Origen permitido para CORS
ALLOWED_ORIGIN=*

# ==========================================
# INSTRUCCIONES:
# 1. Copia este archivo como .env
# 2. Reemplaza MP_ACCESS_TOKEN con tu token real
# 3. Actualiza las URLs según tu configuración
# ==========================================
EOF

log_success "Archivo .env.template creado"

# ==========================================
# PASO 9: RESUMEN FINAL
# ==========================================

echo ""
log_success "🎉 ========================================"
log_success "🎉 LIMPIEZA COMPLETADA"
log_success "🎉 ========================================"
echo ""
log_info "📁 Backup creado en: $BACKUP_DIR"
log_info "📄 Archivo principal: server-mp.js"
log_info "⚙️  Configuración: .env.template"
echo ""
log_info "🚀 PRÓXIMOS PASOS:"
log_info "1. Configurar .env con tu token de Mercado Pago"
log_info "2. Probar el servidor: node server-mp.js"
log_info "3. Iniciar con PM2: pm2 start server-mp.js --name vitacard365"
echo ""
log_warning "⚠️  IMPORTANTE:"
log_warning "- Verifica que tu .env tenga el MP_ACCESS_TOKEN correcto"
log_warning "- El servidor ahora usa puerto 3000 y binding 0.0.0.0"
log_warning "- Todos los archivos eliminados están en el backup"
echo ""

