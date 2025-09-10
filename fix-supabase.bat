@echo off
echo === VitaCard365 - Solucionador de problemas de conexion ===
echo.

REM Verificar si el archivo .env existe
if not exist .env (
  echo Error: No se encontro el archivo .env
  echo Creando archivo .env con la configuracion correcta...
) else (
  echo Encontrado archivo .env existente. Haciendo copia de seguridad...
  copy .env .env.backup >nul
  echo Copia guardada como .env.backup
)

REM Crear/actualizar el archivo .env con la configuración correcta
echo Creando archivo .env con la configuracion correcta para Supabase...
(
  echo # Supabase (autenticacion^) - URL correcta con formato completo
  echo VITE_SUPABASE_URL=https://vymwgkeomyevsckljdw.supabase.co
  echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bXdna2VvbXlldnNja2xqZHciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5MTU5MzAwOCwiZXhwIjoyMDA3MTY5MDA4fQ.2aNYfX9gsKQvM3BO3lOecDok-saM85rx9L_XQJVbnP0
  echo.
  echo # Configuracion para desarrollo local con Mercado Pago en AWS
  echo PUBLIC_URL=http://localhost:5174
  echo VITE_API_BASE_URL=http://54.175.250.15:3000
  echo VITE_ENABLE_MP=true
  echo VITE_MP_PUBLIC_KEY=TEST-026aac38-9a53-4f99-9600-0714f2c2258f
) > .env

echo ✓ Archivo .env actualizado correctamente

REM Verificar y corregir supabaseClient.ts
set SUPABASE_CLIENT=src\lib\supabaseClient.ts
if exist "%SUPABASE_CLIENT%" (
  echo Verificando archivo %SUPABASE_CLIENT%...
  
  REM Hacer copia de seguridad
  copy "%SUPABASE_CLIENT%" "%SUPABASE_CLIENT%.backup" >nul
  
  REM Actualizar el archivo con la lógica corregida
  (
    echo import { createClient } from '@supabase/supabase-js';
    echo.
    echo // Asegurar que la URL tenga el formato correcto (https://^)
    echo const urlRaw = import.meta.env.VITE_SUPABASE_URL;
    echo const url = urlRaw?.startsWith('http'^) ? urlRaw : `https://${urlRaw}`;
    echo const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    echo.
    echo // Debug completo
    echo console.log('=== SUPABASE DEBUG ==='^);
    echo console.log('VITE_SUPABASE_URL:', url^);
    echo console.log('VITE_SUPABASE_ANON_KEY:', anon ? 'present' : 'missing'^);
    echo console.log('All VITE_ vars:', Object.keys(import.meta.env^).filter(k =^> k.startsWith('VITE_'^)^)^);
    echo console.log('====================='^);
    echo.
    echo if (!url ^|^| !anon^) {
    echo   // Error claro y temprano (no pantalla en blanco con stack raro^)
    echo   throw new Error(
    echo     `[Supabase] Variables faltantes. VITE_SUPABASE_URL=${String(url^)} VITE_SUPABASE_ANON_KEY=${anon ? 'present' : 'missing'}`
    echo   ^);
    echo }
    echo.
    echo // exporta una sola instancia
    echo export const supabase = createClient(url, anon, {
    echo   auth: {
    echo     persistSession: true,
    echo     detectSessionInUrl: true,
    echo     autoRefreshToken: true,
    echo     storageKey: 'vita-auth',
    echo     storage: window.localStorage
    echo   },
    echo }^);
  ) > "%SUPABASE_CLIENT%"
  
  echo ✓ Archivo %SUPABASE_CLIENT% actualizado correctamente
) else (
  echo No se encontro el archivo %SUPABASE_CLIENT%
)

echo.
echo === Solucion completada ===
echo.
echo Instrucciones para continuar:
echo 1. Deten cualquier servidor en ejecucion (Ctrl+C^)
echo 2. Ejecuta: npm run dev
echo 3. Intenta iniciar sesion nuevamente
echo.
echo Si sigues teniendo problemas, envia los logs de la consola del navegador

echo.
echo Presiona cualquier tecla para iniciar el servidor de desarrollo...
pause >nul

npm run dev