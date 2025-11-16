# 🧪 SCRIPT DE PRUEBA DETALLADO: Deep Links Nativos VitaCard365

Este documento contiene los pasos exactos para probar los 4 casos de deep links en Android, incluyendo comandos ADB para simular deep links y verificar logs.

---

## 📋 PREREQUISITOS

### 1. Preparar el entorno de testing

```bash
# Conectar dispositivo Android via USB
adb devices

# Debería mostrar:
# List of devices attached
# <device_id>    device

# Verificar que la app está instalada
adb shell pm list packages | grep vitacard365

# Debería mostrar:
# package:com.vitacard365.app

# Verificar la versión del Manifest instalado
adb shell dumpsys package com.vitacard365.app | grep -A 20 "Intent Filter"

# Buscar en el output:
# - vitacard365://auth/callback debe estar en CapacitorActivity
# - vitacard365://auth/recovery debe estar en CapacitorActivity
# - NO debe haber vitacard365://auth en MainActivity
```

### 2. Configurar logs en tiempo real

```bash
# Terminal 1: Logs generales de la app
adb logcat | grep -E "(VitaCard|deeplink|appUrlOpen|Capacitor)"

# Terminal 2: Logs específicos de Supabase
adb logcat | grep -E "(supabase|auth|session)"

# Terminal 3: Logs de navegación
adb logcat | grep -E "(Router|Navigate|location)"
```

### 3. Limpiar estado antes de cada prueba

```bash
# Limpiar datos de la app (logout completo)
adb shell pm clear com.vitacard365.app

# O manualmente:
# - Abrir app
# - Ir a Perfil > Cerrar sesión
# - Verificar que vuelve a onboarding/login
```

---

## 🧪 CASO 1: OAuth Login (Usuario con acceso activo)

### Objetivo
Verificar que un usuario existente con `acceso_activo = true` navega a `/dashboard` después del OAuth.

### Prerequisitos
- Usuario de prueba en Supabase con:
  - Email: `test-activo@vitacard365.com`
  - `acceso_activo = true` en `profiles_certificado_v2`
  - Cuenta de Google vinculada

### Pasos de prueba

#### 1. Preparar la app
```bash
# Limpiar datos
adb shell pm clear com.vitacard365.app

# Abrir la app
adb shell am start -n com.vitacard365.app/.MainActivity

# Esperar a que cargue el onboarding/login
```

#### 2. Iniciar OAuth desde la app
```
1. En el dispositivo:
   - Tocar "Continuar con Google"
   - Seleccionar cuenta: test-activo@vitacard365.com
   - Aceptar permisos
   - Esperar redirección
```

#### 3. Verificar logs en tiempo real
```
Logs esperados en Terminal 1:

[appUrlOpen] vitacard365://auth/callback?code=<code>&state=<state>
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: <user_id>
[deeplink][native] Contexto: login
[deeplink][native] Consultando acceso...
[deeplink][native] Acceso activo: true
[deeplink][native] Navegando a: /dashboard
```

#### 4. Verificar navegación
```
✅ ÉXITO: La app muestra el Dashboard
❌ FALLO: La app se queda en onboarding/login
```

#### 5. Simular deep link manualmente (si falla)
```bash
# Simular el deep link con un code de prueba
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/callback?code=test123&state=test456" \
  com.vitacard365.app

# Verificar logs
# Debería mostrar los mismos logs que arriba
```

#### 6. Verificar estado de la sesión
```bash
# Verificar que la sesión persiste
adb shell am force-stop com.vitacard365.app
adb shell am start -n com.vitacard365.app/.MainActivity

# ✅ ÉXITO: La app abre directamente en Dashboard (sesión persistida)
# ❌ FALLO: La app vuelve a onboarding/login
```

### Resultado esperado
- ✅ Deep link recibido y procesado
- ✅ Sesión obtenida correctamente
- ✅ `acceso_activo` consultado y devuelve `true`
- ✅ Navegación a `/dashboard` exitosa
- ✅ Dashboard visible en pantalla
- ✅ Sesión persiste después de cerrar y reabrir app

---

## 🧪 CASO 2: OAuth Login (Usuario sin acceso activo)

### Objetivo
Verificar que un usuario existente con `acceso_activo = false` navega a `/mi-plan` después del OAuth.

### Prerequisitos
- Usuario de prueba en Supabase con:
  - Email: `test-inactivo@vitacard365.com`
  - `acceso_activo = false` en `profiles_certificado_v2`
  - Cuenta de Google vinculada

### Pasos de prueba

#### 1. Preparar la app
```bash
# Limpiar datos
adb shell pm clear com.vitacard365.app

# Abrir la app
adb shell am start -n com.vitacard365.app/.MainActivity
```

#### 2. Iniciar OAuth desde la app
```
1. En el dispositivo:
   - Tocar "Continuar con Google"
   - Seleccionar cuenta: test-inactivo@vitacard365.com
   - Aceptar permisos
   - Esperar redirección
```

#### 3. Verificar logs en tiempo real
```
Logs esperados en Terminal 1:

[appUrlOpen] vitacard365://auth/callback?code=<code>&state=<state>
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: <user_id>
[deeplink][native] Contexto: login
[deeplink][native] Consultando acceso...
[deeplink][native] Acceso activo: false
[deeplink][native] Navegando a: /mi-plan
```

#### 4. Verificar navegación
```
✅ ÉXITO: La app muestra la pantalla "Mi Plan" (Pagos)
❌ FALLO: La app se queda en onboarding/login
```

#### 5. Verificar que no puede navegar a Dashboard
```
1. En el dispositivo:
   - Intentar navegar a Dashboard (si hay botón/link)
   
✅ ÉXITO: ProtectedRoute redirige de vuelta a /mi-plan
❌ FALLO: Permite acceder a Dashboard sin pago
```

#### 6. Simular deep link manualmente
```bash
# Simular el deep link
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/callback?code=test123&state=test456" \
  com.vitacard365.app

# Verificar logs y navegación
```

### Resultado esperado
- ✅ Deep link recibido y procesado
- ✅ Sesión obtenida correctamente
- ✅ `acceso_activo` consultado y devuelve `false`
- ✅ Navegación a `/mi-plan` exitosa
- ✅ Pantalla "Mi Plan" visible
- ✅ ProtectedRoute bloquea acceso a Dashboard

---

## 🧪 CASO 3: OAuth Register (Usuario nuevo)

### Objetivo
Verificar que un usuario nuevo navega a `/payment-gateway` después del OAuth de registro.

### Prerequisitos
- Cuenta de Google que NO existe en Supabase:
  - Email: `nuevo-usuario-<timestamp>@gmail.com`
  - Usar una cuenta real de Google para pruebas

### Pasos de prueba

#### 1. Preparar la app
```bash
# Limpiar datos
adb shell pm clear com.vitacard365.app

# Abrir la app
adb shell am start -n com.vitacard365.app/.MainActivity
```

#### 2. Navegar a Register
```
1. En el dispositivo:
   - Desde onboarding, tocar "Registrarse" o navegar a /register
   - Verificar que estás en la pantalla de registro
```

#### 3. Iniciar OAuth desde Register
```
1. En el dispositivo:
   - Tocar "Continuar con Google"
   - Seleccionar cuenta nueva (que no existe en Supabase)
   - Aceptar permisos
   - Esperar redirección
```

#### 4. Verificar logs en tiempo real
```
Logs esperados en Terminal 1:

[appUrlOpen] vitacard365://auth/callback?code=<code>&state=<state>
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: <user_id>
[deeplink][native] Contexto: register
[deeplink][native] Navegando a: /payment-gateway
```

#### 5. Verificar navegación
```
✅ ÉXITO: La app muestra la pantalla de Payment Gateway
❌ FALLO: La app se queda en onboarding/login o va a otra pantalla
```

#### 6. Verificar que el perfil se creó
```bash
# Conectar a Supabase y verificar
# O desde la app, verificar que el usuario está logueado

# Verificar en logs que se creó el perfil
adb logcat | grep -E "(profile|insert|create)"
```

#### 7. Simular deep link manualmente
```bash
# Primero, setear el contexto en localStorage
# Esto requiere ejecutar JS en la WebView

# Simular el deep link
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/callback?code=test123&state=test456" \
  com.vitacard365.app

# Verificar logs
```

### Resultado esperado
- ✅ Deep link recibido y procesado
- ✅ Sesión obtenida correctamente
- ✅ Contexto `register` detectado
- ✅ Navegación a `/payment-gateway` exitosa
- ✅ Payment Gateway visible
- ✅ Usuario creado en Supabase
- ✅ `oauth_context` removido de localStorage

---

## 🧪 CASO 4: Recovery (Recuperación de contraseña)

### Objetivo
Verificar que el deep link de recuperación navega a `/set-new-password`.

### Prerequisitos
- Usuario existente en Supabase con email verificado
- Email: `test-recovery@vitacard365.com`

### Pasos de prueba

#### 1. Solicitar recuperación desde web
```
1. Abrir navegador en PC/Mac
2. Ir a: https://vitacard365.com/reset-password
3. Ingresar: test-recovery@vitacard365.com
4. Enviar solicitud
5. Verificar que el email llegó
```

#### 2. Verificar el formato del link en el email
```
El link debería ser:
vitacard365://auth/recovery?token=<token>&type=recovery

O posiblemente:
https://vitacard365.com/auth/recovery?token=<token>&type=recovery
(que luego redirige al deep link)
```

#### 3. Preparar la app en Android
```bash
# Limpiar datos (opcional, recovery debería funcionar con o sin sesión)
adb shell pm clear com.vitacard365.app

# Abrir la app
adb shell am start -n com.vitacard365.app/.MainActivity
```

#### 4. Simular el deep link de recovery
```bash
# Opción 1: Tocar el link en el email desde el dispositivo Android
# (Requiere que el email esté configurado en el dispositivo)

# Opción 2: Simular el deep link con ADB
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/recovery?token=test-token-123&type=recovery" \
  com.vitacard365.app
```

#### 5. Verificar logs en tiempo real
```
Logs esperados en Terminal 1:

[appUrlOpen] vitacard365://auth/recovery?token=<token>&type=recovery
[auth-recovery] deep link recibido: vitacard365://auth/recovery?token=<token>&type=recovery
```

#### 6. Verificar navegación
```
✅ ÉXITO: La app muestra la pantalla "Establecer nueva contraseña"
❌ FALLO: La app se queda en onboarding/login
```

#### 7. Verificar que el formulario funciona
```
1. En el dispositivo:
   - Ingresar nueva contraseña
   - Confirmar contraseña
   - Tocar "Guardar" o "Actualizar"
   
✅ ÉXITO: Contraseña actualizada, redirige a Dashboard o Login
❌ FALLO: Error al actualizar contraseña
```

#### 8. Probar con link real del email
```
1. En el dispositivo Android:
   - Abrir la app de Gmail/Email
   - Abrir el email de recuperación de VitaCard365
   - Tocar el botón/link de recuperación
   
✅ ÉXITO: Abre VitaCard365 y navega a /set-new-password
❌ FALLO: Abre navegador o no abre nada
```

### Resultado esperado
- ✅ Deep link recibido y procesado
- ✅ URL detectada como recovery
- ✅ Navegación a `#/set-new-password` exitosa
- ✅ Formulario de nueva contraseña visible
- ✅ Token de recovery presente en la URL/estado
- ✅ Actualización de contraseña funciona

---

## 🔍 COMANDOS DE DIAGNÓSTICO AVANZADO

### Verificar intent-filters instalados
```bash
# Ver todos los intent-filters de la app
adb shell dumpsys package com.vitacard365.app | grep -A 30 "Activity"

# Buscar específicamente deep links
adb shell dumpsys package com.vitacard365.app | grep -B 5 -A 5 "vitacard365"

# Verificar qué activity maneja cada scheme
adb shell dumpsys package com.vitacard365.app | grep -B 10 "scheme=\"vitacard365\""
```

### Verificar localStorage (requiere root o debugging)
```bash
# Habilitar debugging de WebView
adb shell am start -n com.vitacard365.app/.MainActivity

# Abrir Chrome en PC/Mac
# Ir a: chrome://inspect
# Seleccionar el WebView de VitaCard365
# En la consola ejecutar:
localStorage.getItem('oauth_context')
# Debería mostrar: "login" o "register" o null
```

### Capturar todos los deep links recibidos
```bash
# Monitorear todos los intents recibidos por la app
adb shell am monitor

# En otra terminal, simular deep link
adb shell am start -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/callback?code=test" \
  com.vitacard365.app

# El monitor mostrará qué activity recibió el intent
```

### Verificar estado de la sesión de Supabase
```bash
# En Chrome DevTools (chrome://inspect):
# Consola:
await supabase.auth.getSession()
# Debería devolver: { data: { session: {...} }, error: null }

# Verificar usuario actual:
await supabase.auth.getUser()
# Debería devolver: { data: { user: {...} }, error: null }
```

### Forzar limpieza completa
```bash
# Limpiar datos de la app
adb shell pm clear com.vitacard365.app

# Limpiar caché de WebView
adb shell rm -rf /data/data/com.vitacard365.app/cache/*
adb shell rm -rf /data/data/com.vitacard365.app/app_webview/*

# Reiniciar dispositivo (si es necesario)
adb reboot
```

---

## 📊 MATRIZ DE RESULTADOS

Usar esta tabla para documentar los resultados de cada prueba:

| Caso | Deep Link Recibido | Sesión OK | Contexto OK | Navegación OK | Pantalla Final | Notas |
|------|-------------------|-----------|-------------|---------------|----------------|-------|
| **Login con acceso** | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | Dashboard / Otro | |
| **Login sin acceso** | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | Mi Plan / Otro | |
| **Register** | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | Payment Gateway / Otro | |
| **Recovery** | ✅ / ❌ | N/A | N/A | ✅ / ❌ | Set New Password / Otro | |

---

## 🐛 TROUBLESHOOTING

### Problema: Deep link no se recibe (no aparece [appUrlOpen])

**Diagnóstico**:
```bash
# Verificar que el Manifest tiene los intent-filters correctos
adb shell dumpsys package com.vitacard365.app | grep -A 5 "vitacard365://auth"

# Debe mostrar CapacitorActivity, NO MainActivity
```

**Solución**:
1. Verificar que el commit 9bf85ff está aplicado
2. Recompilar: `npx cap sync android`
3. Clean + Rebuild en Android Studio
4. Desinstalar app completamente: `adb uninstall com.vitacard365.app`
5. Reinstalar APK nuevo

---

### Problema: Deep link se recibe pero sesión es null

**Diagnóstico**:
```
Logs muestran:
[appUrlOpen] vitacard365://auth/callback?code=...
[deeplink][native] OAuth callback recibido
[deeplink][native] Error obteniendo sesión: ...
```

**Solución**:
1. Verificar que Supabase está configurado correctamente
2. Aplicar **Ajuste 2**: Agregar delay de 300ms antes de `getSession()`
3. Verificar conectividad de red del dispositivo
4. Revisar configuración de PKCE en Supabase dashboard

---

### Problema: Sesión OK pero navegación no ocurre

**Diagnóstico**:
```
Logs muestran:
[deeplink][native] Navegando a: /dashboard
(pero la app se queda en login/onboarding)
```

**Solución**:
1. Aplicar **Ajuste 3**: Cambiar `window.location.hash` por `window.location.replace()`
2. Verificar que HashRouter está montado:
   ```javascript
   // En Chrome DevTools:
   console.log(window.location.hash)
   // Debería mostrar: #/dashboard
   ```
3. Verificar que no hay guards bloqueando:
   ```javascript
   // En Chrome DevTools:
   localStorage.getItem('oauth_context')
   // Debería ser null después de la navegación
   ```

---

### Problema: Navegación ocurre pero ProtectedRoute redirige

**Diagnóstico**:
```
La app navega a /dashboard pero inmediatamente redirige a /login o /mi-plan
```

**Solución**:
1. Verificar que `AuthContext` tiene la sesión:
   ```javascript
   // En Chrome DevTools:
   // Inspeccionar el contexto de React
   ```
2. Verificar que `access.activo` está seteado correctamente
3. Revisar logs de `ProtectedRoute.jsx`

---

## 📝 CHECKLIST FINAL

Antes de dar por terminado el testing:

- [ ] Los 4 casos pasan exitosamente
- [ ] Los logs muestran el flujo completo en cada caso
- [ ] La navegación es correcta en cada caso
- [ ] La sesión persiste después de cerrar/reabrir app
- [ ] ProtectedRoute funciona correctamente (bloquea sin acceso)
- [ ] El botón "atrás" no lleva al callback (gracias a `replace()`)
- [ ] Recovery funciona desde email real
- [ ] No hay errores en consola
- [ ] La UX es fluida (sin delays perceptibles)
- [ ] Funciona en múltiples dispositivos Android

---

## 🚀 COMANDOS RÁPIDOS DE REFERENCIA

```bash
# Limpiar y recompilar
npx cap sync android && npx cap open android

# Desinstalar e instalar
adb uninstall com.vitacard365.app
adb install -r app-debug.apk

# Logs en tiempo real
adb logcat | grep -E "(appUrlOpen|deeplink)"

# Simular OAuth callback
adb shell am start -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/callback?code=test123" \
  com.vitacard365.app

# Simular recovery
adb shell am start -W -a android.intent.action.VIEW \
  -d "vitacard365://auth/recovery?token=test456" \
  com.vitacard365.app

# Limpiar datos
adb shell pm clear com.vitacard365.app

# Verificar Manifest
adb shell dumpsys package com.vitacard365.app | grep -A 5 "vitacard365"
```

---

**FIN DEL SCRIPT DE PRUEBA**
