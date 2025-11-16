# 🔍 AUDITORÍA TÉCNICA: Deep Links Nativos VitaCard365

**Fecha**: 16 de noviembre de 2025  
**Estado**: AndroidManifest corregido, pero flujo de navegación no funciona  
**Objetivo**: Identificar exactamente dónde se rompe el flujo después del deep link

---

## ✅ 1. VERIFICACIÓN DEL FIX DEL ANDROIDMANIFEST

**Commit**: `9bf85ff3c2ebb019f81ce0c9df85e1ede80d6ce1`  
**Branch**: `release/ses-emails-vitacard`

### Cambios aplicados:
- ✅ **Eliminado** el intent-filter duplicado de `MainActivity` (líneas 77-82)
- ✅ **Conservados** los intent-filters de `CapacitorActivity`:
  - `vitacard365://auth/callback` (OAuth)
  - `vitacard365://auth/recovery` (recuperación de contraseña)
- ✅ **Conservado** el intent-filter de `MainActivity` para:
  - `vitacard365://mp-return` (Mercado Pago)
  - HTTPS App Links (vitacard365.com, links.vitacard365.com)

### Estado del Manifest:
```xml
<!-- MainActivity: solo HTTPS y mp-return -->
<activity android:name="com.vitacard365.app.MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  <intent-filter android:autoVerify="true">
    <!-- HTTPS App Links -->
    <data android:scheme="https" android:host="vitacard365.com" />
  </intent-filter>
  <intent-filter>
    <!-- Mercado Pago -->
    <data android:scheme="vitacard365" android:host="mp-return" />
  </intent-filter>
</activity>

<!-- CapacitorActivity: OAuth y recovery -->
<activity android:name="com.capacitorjs.app.CapacitorActivity">
  <intent-filter android:autoVerify="true">
    <data android:scheme="vitacard365" android:host="auth" android:pathPrefix="/callback" />
  </intent-filter>
  <intent-filter>
    <data android:scheme="vitacard365" android:host="auth" android:pathPrefix="/recovery" />
  </intent-filter>
</activity>
```

**✅ CONCLUSIÓN**: El fix del Manifest es **correcto**. Los deep links `vitacard365://auth/*` ahora van exclusivamente a `CapacitorActivity`.

---

## 🔍 2. AUDITORÍA DE INICIALIZACIÓN: initAuthDeepLinks()

### Ubicación: `src/App.jsx` línea 69
```jsx
function App() {
  useEffect(() => { initAuthDeepLinks(); }, []);
  // ...
}
```

**✅ VERIFICADO**: `initAuthDeepLinks()` se ejecuta en el primer render de App.

### Implementación: `src/lib/deeplinks.ts` líneas 7-11
```typescript
let inited = false;

export function initAuthDeepLinks() {
  if (inited) return;
  inited = true;
  // Only meaningful on native platforms
  if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;
  // ...
}
```

**🚨 PROBLEMA CRÍTICO IDENTIFICADO**:

La línea 11 tiene un **error de sintaxis**:
```typescript
if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;
```

### Análisis del error:
1. `Capacitor.isNativePlatform` es una **función**, no una propiedad booleana
2. La condición evalúa: `!(función && función())`
3. En JavaScript, una función siempre es "truthy"
4. Por lo tanto: `función && función()` → `true && true` → `true`
5. Y luego: `!true` → `false`
6. **RESULTADO**: El guard **NUNCA** retorna, el listener **SÍ** se registra

**✅ CONCLUSIÓN**: El guard está mal escrito pero **funciona por accidente**. El listener sí se registra.

---

## 🔍 3. AUDITORÍA DEL LISTENER: App.addListener('appUrlOpen')

### Implementación: `src/lib/deeplinks.ts` líneas 14-16
```typescript
// Elimina listeners duplicados antes de agregar el único
App.removeAllListeners();

App.addListener('appUrlOpen', async ({ url }) => {
  try { console.log('[appUrlOpen]', url); } catch {}
  // ...
});
```

**✅ VERIFICADO**: 
- Se eliminan listeners duplicados antes de registrar el nuevo
- El listener se registra correctamente
- El primer log `console.log('[appUrlOpen]', url)` debería aparecer en consola

**❓ PREGUNTA CRÍTICA**: ¿Este log aparece en la consola de Android cuando vuelves del OAuth?

---

## 🔍 4. AUDITORÍA DE LA LÓGICA DE NAVEGACIÓN

### Caso 1: OAuth Login (vitacard365://auth/callback)

**Flujo esperado**:
1. Usuario hace login con Google desde `/login`
2. `src/lib/auth.ts` guarda `oauth_context = 'login'` en localStorage (línea 49)
3. Supabase redirige a `vitacard365://auth/callback?code=...`
4. Android abre `CapacitorActivity`
5. Capacitor dispara `appUrlOpen` con la URL completa
6. `deeplinks.ts` detecta `isAuthUrl = true` (línea 49)
7. Llama a `supabase.auth.getSession()` (línea 54)
8. Lee `oauth_context = 'login'` (línea 64)
9. Consulta `acceso_activo` en Supabase (líneas 77-81)
10. Navega a `/dashboard` (si activo) o `/mi-plan` (si inactivo) (líneas 85-91)

**Logs esperados en consola**:
```
[appUrlOpen] vitacard365://auth/callback?code=...
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: <user_id>
[deeplink][native] Contexto: login
[deeplink][native] Consultando acceso...
[deeplink][native] Acceso activo: true/false
[deeplink][native] Navegando a: /dashboard o /mi-plan
```

### Caso 2: OAuth Register (vitacard365://auth/callback)

**Flujo esperado**:
1. Usuario hace registro con Google desde `/register`
2. `src/lib/auth.ts` guarda `oauth_context = 'register'` en localStorage
3. Supabase redirige a `vitacard365://auth/callback?code=...`
4. Android abre `CapacitorActivity`
5. Capacitor dispara `appUrlOpen`
6. `deeplinks.ts` detecta `isAuthUrl = true`
7. Llama a `supabase.auth.getSession()`
8. Lee `oauth_context = 'register'` (línea 64)
9. Navega directamente a `/payment-gateway` (líneas 66-74)

**Logs esperados**:
```
[appUrlOpen] vitacard365://auth/callback?code=...
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: <user_id>
[deeplink][native] Contexto: register
[deeplink][native] Navegando a: /payment-gateway
```

### Caso 3: Recuperación de contraseña (vitacard365://auth/recovery)

**Flujo esperado**:
1. Usuario recibe email de recuperación
2. Toca el link en el correo
3. Android abre `CapacitorActivity` con `vitacard365://auth/recovery?token=...`
4. Capacitor dispara `appUrlOpen`
5. `deeplinks.ts` detecta `url.startsWith('vitacard365://auth/recovery')` (línea 40)
6. Navega a `#/set-new-password` (línea 44)

**Logs esperados**:
```
[appUrlOpen] vitacard365://auth/recovery?token=...
[auth-recovery] deep link recibido: vitacard365://auth/recovery?token=...
```

---

## 🚨 5. DIAGNÓSTICO: DÓNDE SE ROMPE EL FLUJO

### Hipótesis 1: El listener NO se dispara
**Síntoma**: La app se abre pero no hay logs de `[appUrlOpen]` en consola.

**Causa posible**: 
- Android sigue abriendo MainActivity en lugar de CapacitorActivity
- El fix del Manifest no se aplicó correctamente en el APK instalado

**Verificación**:
1. Confirmar que el APK se recompiló después del commit 9bf85ff
2. Confirmar que el APK se reinstaló (no solo actualizó)
3. Verificar logs de Android Studio con filtro: `appUrlOpen`

**Solución**: Recompilar y reinstalar completamente:
```bash
cd /home/ubuntu/VitaCard365
npx cap sync android
npx cap open android
# En Android Studio: Build > Clean Project > Rebuild Project
# Desinstalar app del dispositivo
# Instalar nuevo APK
```

---

### Hipótesis 2: El listener se dispara pero la URL está mal formateada
**Síntoma**: Aparece `[appUrlOpen]` en consola pero la URL no coincide con los patrones esperados.

**Causa posible**:
- Supabase está enviando una URL diferente (ej: con hash, con query params extra)
- La normalización de la URL en línea 22 está fallando

**Verificación**:
1. Revisar el log exacto de `[appUrlOpen]`
2. Comparar con los patrones en líneas 23-27

**Solución**: Ajustar los patrones de detección en `deeplinks.ts` líneas 23-27.

---

### Hipótesis 3: El listener se dispara pero getSession() falla
**Síntoma**: Aparece `[appUrlOpen]` y `[deeplink][native] OAuth callback recibido`, pero luego error o navegación a `/login`.

**Causa posible**:
- Supabase no completó el intercambio PKCE
- La sesión no está disponible inmediatamente después del deep link
- Error de red o timeout

**Verificación**:
1. Revisar si aparece el log: `[deeplink][native] Error obteniendo sesión:`
2. Revisar el error específico en consola

**Solución**: Agregar retry logic o delay antes de `getSession()`:
```typescript
// Esperar un momento para que Supabase procese el callback
await new Promise(resolve => setTimeout(resolve, 500));
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
```

---

### Hipótesis 4: El listener funciona pero la navegación no se ejecuta
**Síntoma**: Todos los logs aparecen correctamente, incluyendo `[deeplink][native] Navegando a: /dashboard`, pero la app se queda en onboarding/login.

**Causa posible**:
- `window.location.hash` no está funcionando en el contexto de Capacitor
- Hay un guard o interceptor que está bloqueando la navegación
- El HashRouter no está respondiendo al cambio de hash

**Verificación**:
1. Confirmar que aparecen los logs de navegación
2. Verificar el valor de `window.location.hash` después del deep link
3. Revisar si hay errores en consola después de la navegación

**Solución**: Usar el router de React directamente en lugar de `window.location.hash`:
```typescript
// En lugar de:
window.location.hash = '#/dashboard';

// Usar:
import { useNavigate } from 'react-router-dom';
// Pero esto requiere que el listener esté dentro de un componente React
// Alternativa: usar un evento personalizado
window.dispatchEvent(new CustomEvent('deeplink-navigate', { detail: { path: '/dashboard' } }));
```

---

### Hipótesis 5: Timing issue - La app se reinicia antes de ejecutar la navegación
**Síntoma**: Los logs aparecen pero la app se "resetea" a la pantalla inicial.

**Causa posible**:
- Android está matando el proceso de la app después del deep link
- El listener se ejecuta pero luego la app se reinicia por configuración de `launchMode`

**Verificación**:
1. Revisar el `launchMode` de ambas activities en AndroidManifest
2. Confirmar que ambas tienen `singleTask` (líneas 59 y 89)

**Solución**: Ya está configurado correctamente con `singleTask`. Si el problema persiste, considerar:
- Agregar `android:taskAffinity=""` a CapacitorActivity
- Verificar que no hay código que esté llamando a `finish()` o `recreate()`

---

## 📋 6. PLAN DE DIAGNÓSTICO PASO A PASO

Para identificar exactamente dónde se rompe, seguir estos pasos:

### Paso 1: Verificar que el APK tiene el fix
```bash
# Extraer el APK instalado
adb shell pm path com.vitacard365.app
adb pull <path> app.apk

# Descomprimir y verificar el Manifest
unzip -p app.apk AndroidManifest.xml | xmllint --format -

# Buscar intent-filters de vitacard365://auth
# Debe aparecer SOLO en CapacitorActivity, NO en MainActivity
```

### Paso 2: Habilitar logs de Capacitor
```bash
# Conectar dispositivo Android
adb devices

# Ver logs en tiempo real
adb logcat | grep -E "(appUrlOpen|deeplink|Capacitor)"
```

### Paso 3: Probar OAuth y capturar logs
1. Abrir la app
2. Ir a `/login`
3. Tocar "Continuar con Google"
4. Seleccionar cuenta
5. **OBSERVAR**: ¿La app se abre? ¿Aparecen logs?
6. Capturar todos los logs desde el momento del deep link

### Paso 4: Analizar los logs
- ✅ Si aparece `[appUrlOpen]` → El listener funciona, pasar a Paso 5
- ❌ Si NO aparece → El problema está en el Manifest o el APK, volver a Paso 1

### Paso 5: Verificar la URL recibida
- ✅ Si la URL es `vitacard365://auth/callback?code=...` → Correcto, pasar a Paso 6
- ❌ Si la URL es diferente → Ajustar patrones en `deeplinks.ts` líneas 23-27

### Paso 6: Verificar getSession()
- ✅ Si aparece "Sesión obtenida" → Correcto, pasar a Paso 7
- ❌ Si aparece "Error obteniendo sesión" → Problema con Supabase, agregar retry

### Paso 7: Verificar navegación
- ✅ Si aparece "Navegando a: /dashboard" → El código funciona, problema con el router
- ❌ Si NO aparece → Problema con la lógica de decisión, revisar `oauth_context` y `acceso_activo`

### Paso 8: Verificar el router
```typescript
// Agregar log después de setear el hash
console.log('[deeplink][native] Hash seteado:', window.location.hash);
console.log('[deeplink][native] Href actual:', window.location.href);

// Verificar que el HashRouter está montado
console.log('[deeplink][native] Router montado:', !!document.querySelector('[data-router]'));
```

---

## 🎯 7. SOLUCIÓN PROPUESTA (MÍNIMA)

Basándome en la auditoría, propongo **3 ajustes mínimos** sin cambiar la arquitectura:

### Ajuste 1: Corregir el guard de Capacitor.isNativePlatform
**Archivo**: `src/lib/deeplinks.ts` línea 11  
**Problema**: Sintaxis incorrecta (funciona por accidente)  
**Solución**:
```typescript
// ANTES (línea 11):
if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;

// DESPUÉS:
if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;
```

**Justificación**: Aunque funciona, el código actual es confuso y puede fallar en futuras versiones de Capacitor.

---

### Ajuste 2: Agregar delay antes de getSession()
**Archivo**: `src/lib/deeplinks.ts` línea 54  
**Problema**: Supabase puede necesitar tiempo para procesar el callback PKCE  
**Solución**:
```typescript
// ANTES (línea 54):
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

// DESPUÉS:
// Dar tiempo a Supabase para procesar el PKCE
await new Promise(resolve => setTimeout(resolve, 300));
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
```

**Justificación**: En dispositivos lentos o con conexión lenta, `getSession()` puede ejecutarse antes de que Supabase termine el intercambio PKCE.

---

### Ajuste 3: Forzar navegación con replace
**Archivo**: `src/lib/deeplinks.ts` líneas 44, 70, 87, 90  
**Problema**: `window.location.hash` puede no disparar el router si ya estás en esa ruta  
**Solución**:
```typescript
// ANTES (línea 44):
window.location.hash = '#/set-new-password';

// DESPUÉS:
window.location.replace('#/set-new-password');

// APLICAR EN TODAS LAS NAVEGACIONES:
// Línea 70: window.location.replace('#/payment-gateway');
// Línea 87: window.location.replace('#/dashboard');
// Línea 90: window.location.replace('#/mi-plan');
```

**Justificación**: `replace()` fuerza la navegación sin agregar entrada al historial, evitando problemas con el botón "atrás".

---

## 📊 8. RESUMEN EJECUTIVO

### ¿Se dispara appUrlOpen?
**RESPUESTA**: Debería dispararse. El Manifest está correcto y el listener está registrado.

**PERO**: Necesitamos confirmar con logs reales. Si NO se dispara, el problema está en:
- APK no recompilado/reinstalado
- Configuración de launchMode
- Android cacheando el Manifest viejo

### ¿Qué URL llega en cada caso?

| Caso | URL esperada | Decisión lógica | Navegación final |
|------|-------------|-----------------|------------------|
| **OAuth Login** | `vitacard365://auth/callback?code=...` | Leer `oauth_context='login'` → Consultar `acceso_activo` | `/dashboard` (si activo) o `/mi-plan` (si inactivo) |
| **OAuth Register** | `vitacard365://auth/callback?code=...` | Leer `oauth_context='register'` | `/payment-gateway` |
| **Recovery** | `vitacard365://auth/recovery?token=...` | Detectar `startsWith('vitacard365://auth/recovery')` | `#/set-new-password` |

### ¿Dónde se pierde el flujo?

**HIPÓTESIS MÁS PROBABLE**: El listener se dispara, `getSession()` funciona, pero la navegación con `window.location.hash` no está funcionando en el contexto de Capacitor.

**ARCHIVO/LÍNEA**: `src/lib/deeplinks.ts` líneas 44, 70, 87, 90

**PROBLEMA**: `window.location.hash = '#/ruta'` puede no disparar el HashRouter si:
1. Ya estás en esa ruta
2. El router no está montado todavía
3. Hay un guard bloqueando la navegación

**SOLUCIÓN MÍNIMA**: Cambiar `window.location.hash` por `window.location.replace()` en las 4 líneas.

---

## ✅ 9. PRÓXIMOS PASOS

1. **INMEDIATO**: Aplicar los 3 ajustes mínimos propuestos
2. **TESTING**: Recompilar APK y probar con logs habilitados
3. **VALIDACIÓN**: Confirmar que los 3 casos funcionan (login, register, recovery)
4. **DOCUMENTACIÓN**: Actualizar README con instrucciones de deep links

---

## 📝 10. NOTAS ADICIONALES

### Sobre el guard de ProtectedRoute
El código actual en `ProtectedRoute.jsx` **NO** debería interferir con la navegación del deep link porque:
1. La navegación ocurre via `window.location.hash` (fuera de React)
2. El guard solo afecta a rutas protegidas **después** de que el router las procese
3. Las rutas de destino (`/dashboard`, `/mi-plan`, `/payment-gateway`) están todas protegidas, pero el usuario ya tiene sesión después del OAuth

### Sobre el timing de AuthContext
`AuthContext` tiene un `useEffect` que llama a `getSession()` al montar (línea 28). Esto podría crear una race condition con el listener de deep links, pero **NO** debería ser un problema porque:
1. El listener de deep links también llama a `getSession()` (línea 54)
2. Ambos usan la misma instancia de Supabase
3. `getSession()` es idempotente (devuelve la sesión cacheada)

### Sobre el HashRouter
El proyecto usa `HashRouter` en nativo (línea 92 de App.jsx), lo cual es correcto para Capacitor. La navegación con `window.location.hash` debería funcionar, pero `window.location.replace()` es más confiable.

---

**FIN DE LA AUDITORÍA**
