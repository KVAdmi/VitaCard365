@echo off
echo ===== VitaCard365 - Asistente de Configuracion =====
echo.

REM Verificar si Python está instalado
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python no esta instalado. Verificando manualmente...
    goto :manual_check
)

REM Verificar si el módulo requests está instalado
python -c "import requests" 2>nul
if %ERRORLEVEL% neq 0 (
    echo Instalando el modulo requests de Python...
    pip install requests
)

REM Ejecutar el verificador de configuración
python verify-config.py
goto :start_dev

:manual_check
echo Verificando archivo .env manualmente...
if not exist .env (
    echo Creando archivo .env...
    (
        echo # Supabase (autenticacion)
        echo VITE_SUPABASE_URL=https://vymwgkeomyevsckljdw.supabase.co
        echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bXdna2VvbXlldnNja2xqZHciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5MTU5MzAwOCwiZXhwIjoyMDA3MTY5MDA4fQ.2aNYfX9gsKQvM3BO3lOecDok-saM85rx9L_XQJVbnP0
        echo.
        echo # Configuracion para desarrollo local con Mercado Pago en AWS
        echo PUBLIC_URL=http://localhost:5173
        echo VITE_API_BASE_URL=http://54.175.250.15:3000
        echo VITE_ENABLE_MP=true
        echo VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
    ) > .env
    echo Archivo .env creado correctamente!
) else (
    echo Archivo .env encontrado.
)

:start_dev
echo.
echo Configuracion completada. Iniciando servidor de desarrollo...
echo.
npm run dev