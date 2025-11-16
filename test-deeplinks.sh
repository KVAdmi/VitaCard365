#!/bin/bash

# Script automatizado para testing de deep links en VitaCard365
# Uso: ./test-deeplinks.sh [caso]
# Casos: login-activo, login-inactivo, register, recovery, all

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PACKAGE="com.vitacard365.app"
MAIN_ACTIVITY=".MainActivity"

# Función para imprimir con color
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar que el dispositivo está conectado
check_device() {
    print_header "Verificando dispositivo Android"
    
    if ! adb devices | grep -q "device$"; then
        print_error "No hay dispositivo Android conectado"
        echo "Conecta un dispositivo via USB y habilita USB debugging"
        exit 1
    fi
    
    print_success "Dispositivo conectado"
}

# Verificar que la app está instalada
check_app() {
    print_header "Verificando instalación de VitaCard365"
    
    if ! adb shell pm list packages | grep -q "$PACKAGE"; then
        print_error "VitaCard365 no está instalada"
        echo "Instala la app primero: adb install app-debug.apk"
        exit 1
    fi
    
    print_success "VitaCard365 instalada"
}

# Verificar los intent-filters del Manifest
check_manifest() {
    print_header "Verificando intent-filters del Manifest"
    
    print_info "Buscando vitacard365://auth/callback..."
    if adb shell dumpsys package "$PACKAGE" | grep -q "vitacard365://auth/callback"; then
        print_success "vitacard365://auth/callback encontrado"
    else
        print_error "vitacard365://auth/callback NO encontrado"
    fi
    
    print_info "Verificando que está en CapacitorActivity..."
    if adb shell dumpsys package "$PACKAGE" | grep -B 10 "vitacard365://auth/callback" | grep -q "CapacitorActivity"; then
        print_success "Está en CapacitorActivity (correcto)"
    else
        print_error "NO está en CapacitorActivity"
    fi
    
    print_info "Verificando que NO está en MainActivity..."
    if adb shell dumpsys package "$PACKAGE" | grep -B 10 "vitacard365://auth" | grep -q "MainActivity.*vitacard365://auth/callback"; then
        print_error "DUPLICADO en MainActivity (incorrecto)"
    else
        print_success "NO está en MainActivity (correcto)"
    fi
}

# Limpiar datos de la app
clear_app_data() {
    print_header "Limpiando datos de la app"
    
    adb shell pm clear "$PACKAGE" > /dev/null 2>&1
    print_success "Datos limpiados"
    sleep 1
}

# Abrir la app
open_app() {
    print_header "Abriendo VitaCard365"
    
    adb shell am start -n "$PACKAGE/$MAIN_ACTIVITY" > /dev/null 2>&1
    print_success "App abierta"
    sleep 2
}

# Iniciar captura de logs
start_logs() {
    local log_file=$1
    print_info "Iniciando captura de logs en: $log_file"
    
    # Limpiar logs anteriores
    adb logcat -c
    
    # Iniciar captura en background
    adb logcat | grep -E "(appUrlOpen|deeplink|Capacitor)" > "$log_file" &
    LOG_PID=$!
    
    sleep 1
    print_success "Captura de logs iniciada (PID: $LOG_PID)"
}

# Detener captura de logs
stop_logs() {
    if [ ! -z "$LOG_PID" ]; then
        print_info "Deteniendo captura de logs..."
        kill $LOG_PID 2>/dev/null || true
        print_success "Captura detenida"
    fi
}

# Simular deep link
simulate_deeplink() {
    local url=$1
    local description=$2
    
    print_header "Simulando deep link: $description"
    print_info "URL: $url"
    
    adb shell am start -W -a android.intent.action.VIEW -d "$url" "$PACKAGE" > /dev/null 2>&1
    
    print_success "Deep link enviado"
    print_info "Esperando 3 segundos para procesar..."
    sleep 3
}

# Analizar logs
analyze_logs() {
    local log_file=$1
    local expected_context=$2
    local expected_navigation=$3
    
    print_header "Analizando logs"
    
    if [ ! -f "$log_file" ]; then
        print_error "Archivo de logs no encontrado: $log_file"
        return 1
    fi
    
    # Verificar que el deep link fue recibido
    if grep -q "\[appUrlOpen\]" "$log_file"; then
        print_success "Deep link recibido"
    else
        print_error "Deep link NO recibido"
        return 1
    fi
    
    # Verificar que el callback fue procesado
    if grep -q "OAuth callback recibido" "$log_file"; then
        print_success "Callback procesado"
    else
        print_error "Callback NO procesado"
        return 1
    fi
    
    # Verificar sesión
    if grep -q "Sesión obtenida" "$log_file"; then
        print_success "Sesión obtenida"
    else
        print_error "Sesión NO obtenida"
        return 1
    fi
    
    # Verificar contexto (si aplica)
    if [ ! -z "$expected_context" ]; then
        if grep -q "Contexto: $expected_context" "$log_file"; then
            print_success "Contexto correcto: $expected_context"
        else
            print_error "Contexto incorrecto (esperado: $expected_context)"
            return 1
        fi
    fi
    
    # Verificar navegación
    if grep -q "Navegando a: $expected_navigation" "$log_file"; then
        print_success "Navegación correcta: $expected_navigation"
    else
        print_error "Navegación incorrecta (esperado: $expected_navigation)"
        return 1
    fi
    
    print_success "Todos los logs son correctos"
    return 0
}

# Mostrar logs completos
show_logs() {
    local log_file=$1
    
    print_header "Logs completos"
    
    if [ -f "$log_file" ]; then
        cat "$log_file"
    else
        print_warning "No hay logs disponibles"
    fi
}

# Test Case 1: OAuth Login con acceso activo
test_login_activo() {
    print_header "CASO 1: OAuth Login (Usuario con acceso activo)"
    
    local log_file="logs_login_activo.txt"
    
    clear_app_data
    open_app
    
    print_warning "ACCIÓN MANUAL REQUERIDA:"
    echo "1. En el dispositivo, toca 'Continuar con Google'"
    echo "2. Selecciona una cuenta con acceso_activo = true"
    echo "3. Acepta los permisos"
    echo ""
    read -p "Presiona ENTER cuando hayas completado el OAuth..."
    
    start_logs "$log_file"
    
    print_info "Esperando 10 segundos para capturar logs..."
    sleep 10
    
    stop_logs
    
    if analyze_logs "$log_file" "login" "/dashboard"; then
        print_success "✅ CASO 1 PASÓ"
    else
        print_error "❌ CASO 1 FALLÓ"
        show_logs "$log_file"
    fi
}

# Test Case 2: OAuth Login sin acceso activo
test_login_inactivo() {
    print_header "CASO 2: OAuth Login (Usuario sin acceso activo)"
    
    local log_file="logs_login_inactivo.txt"
    
    clear_app_data
    open_app
    
    print_warning "ACCIÓN MANUAL REQUERIDA:"
    echo "1. En el dispositivo, toca 'Continuar con Google'"
    echo "2. Selecciona una cuenta con acceso_activo = false"
    echo "3. Acepta los permisos"
    echo ""
    read -p "Presiona ENTER cuando hayas completado el OAuth..."
    
    start_logs "$log_file"
    
    print_info "Esperando 10 segundos para capturar logs..."
    sleep 10
    
    stop_logs
    
    if analyze_logs "$log_file" "login" "/mi-plan"; then
        print_success "✅ CASO 2 PASÓ"
    else
        print_error "❌ CASO 2 FALLÓ"
        show_logs "$log_file"
    fi
}

# Test Case 3: OAuth Register
test_register() {
    print_header "CASO 3: OAuth Register (Usuario nuevo)"
    
    local log_file="logs_register.txt"
    
    clear_app_data
    open_app
    
    print_warning "ACCIÓN MANUAL REQUERIDA:"
    echo "1. En el dispositivo, navega a 'Registrarse'"
    echo "2. Toca 'Continuar con Google'"
    echo "3. Selecciona una cuenta NUEVA (que no existe en Supabase)"
    echo "4. Acepta los permisos"
    echo ""
    read -p "Presiona ENTER cuando hayas completado el OAuth..."
    
    start_logs "$log_file"
    
    print_info "Esperando 10 segundos para capturar logs..."
    sleep 10
    
    stop_logs
    
    if analyze_logs "$log_file" "register" "/payment-gateway"; then
        print_success "✅ CASO 3 PASÓ"
    else
        print_error "❌ CASO 3 FALLÓ"
        show_logs "$log_file"
    fi
}

# Test Case 4: Recovery
test_recovery() {
    print_header "CASO 4: Recovery (Recuperación de contraseña)"
    
    local log_file="logs_recovery.txt"
    local test_url="vitacard365://auth/recovery?token=test-token-123&type=recovery"
    
    clear_app_data
    open_app
    
    start_logs "$log_file"
    
    simulate_deeplink "$test_url" "Recovery"
    
    stop_logs
    
    print_header "Analizando logs de recovery"
    
    if grep -q "\[appUrlOpen\].*recovery" "$log_file"; then
        print_success "Deep link de recovery recibido"
    else
        print_error "Deep link de recovery NO recibido"
        show_logs "$log_file"
        return 1
    fi
    
    if grep -q "auth-recovery" "$log_file"; then
        print_success "Handler de recovery ejecutado"
    else
        print_error "Handler de recovery NO ejecutado"
        show_logs "$log_file"
        return 1
    fi
    
    print_success "✅ CASO 4 PASÓ"
}

# Test simulado de OAuth callback
test_oauth_simulation() {
    print_header "TEST SIMULADO: OAuth Callback"
    
    local log_file="logs_oauth_simulation.txt"
    local test_url="vitacard365://auth/callback?code=test123&state=test456"
    
    clear_app_data
    open_app
    
    start_logs "$log_file"
    
    simulate_deeplink "$test_url" "OAuth Callback (simulado)"
    
    stop_logs
    
    print_header "Analizando logs"
    
    if grep -q "\[appUrlOpen\].*callback" "$log_file"; then
        print_success "Deep link recibido"
    else
        print_error "Deep link NO recibido"
    fi
    
    if grep -q "OAuth callback recibido" "$log_file"; then
        print_success "Callback procesado"
    else
        print_error "Callback NO procesado"
    fi
    
    show_logs "$log_file"
}

# Menú principal
show_menu() {
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║  VitaCard365 - Deep Links Testing Script      ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Selecciona un caso de prueba:"
    echo ""
    echo "  1) OAuth Login (con acceso activo)"
    echo "  2) OAuth Login (sin acceso activo)"
    echo "  3) OAuth Register (usuario nuevo)"
    echo "  4) Recovery (recuperación de contraseña)"
    echo "  5) Simulación de OAuth (sin OAuth real)"
    echo "  6) Ejecutar todos los casos"
    echo "  7) Solo verificar configuración"
    echo "  0) Salir"
    echo ""
    read -p "Opción: " option
    echo ""
    
    case $option in
        1) test_login_activo ;;
        2) test_login_inactivo ;;
        3) test_register ;;
        4) test_recovery ;;
        5) test_oauth_simulation ;;
        6) 
            test_login_activo
            test_login_inactivo
            test_register
            test_recovery
            ;;
        7)
            check_device
            check_app
            check_manifest
            ;;
        0) 
            print_info "Saliendo..."
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            show_menu
            ;;
    esac
}

# Cleanup al salir
cleanup() {
    stop_logs
    print_info "Limpieza completada"
}

trap cleanup EXIT

# Main
main() {
    # Verificar prerequisitos
    check_device
    check_app
    
    # Si se pasó un argumento, ejecutar ese caso
    if [ $# -eq 1 ]; then
        case $1 in
            login-activo) test_login_activo ;;
            login-inactivo) test_login_inactivo ;;
            register) test_register ;;
            recovery) test_recovery ;;
            simulation) test_oauth_simulation ;;
            all)
                test_login_activo
                test_login_inactivo
                test_register
                test_recovery
                ;;
            check)
                check_manifest
                ;;
            *)
                echo "Uso: $0 [login-activo|login-inactivo|register|recovery|simulation|all|check]"
                exit 1
                ;;
        esac
    else
        # Mostrar menú interactivo
        show_menu
    fi
}

main "$@"
