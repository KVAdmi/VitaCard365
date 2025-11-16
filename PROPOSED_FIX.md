# 🔧 AJUSTES MÍNIMOS PROPUESTOS

Basándome en la auditoría técnica completa, estos son los **3 ajustes mínimos** que deben aplicarse para resolver el problema de navegación en deep links nativos.

---

## 🎯 Ajuste 1: Corregir guard de Capacitor.isNativePlatform

**Archivo**: `src/lib/deeplinks.ts`  
**Línea**: 11  
**Problema**: Sintaxis incorrecta que funciona por accidente  
**Prioridad**: Media (funciona pero es frágil)

### Cambio:
```typescript
// ❌ ANTES (línea 11):
if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;

// ✅ DESPUÉS:
if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;
```

### Justificación:
El código actual evalúa `!(función && función())`, lo cual funciona porque:
- Una función siempre es "truthy"
- `función && función()` → `true && true` → `true`
- `!true` → `false` → NO retorna, continúa

Pero es confuso y puede fallar en futuras versiones de Capacitor. La forma correcta es verificar que la función existe Y que devuelve true.

---

## 🎯 Ajuste 2: Agregar delay antes de getSession()

**Archivo**: `src/lib/deeplinks.ts`  
**Línea**: 54  
**Problema**: Supabase puede necesitar tiempo para procesar el callback PKCE  
**Prioridad**: Alta (puede ser la causa del problema)

### Cambio:
```typescript
// ❌ ANTES (línea 54):
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

// ✅ DESPUÉS:
// Dar tiempo a Supabase para procesar el PKCE callback
await new Promise(resolve => setTimeout(resolve, 300));
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
```

### Justificación:
En dispositivos lentos o con conexión lenta, el deep link puede llegar antes de que Supabase termine de procesar el intercambio PKCE. Un delay de 300ms asegura que la sesión esté disponible sin impactar significativamente la UX.

**Alternativa más robusta** (si el delay no funciona):
```typescript
// Retry con backoff exponencial
let sessionData = null;
let sessionError = null;
for (let i = 0; i < 3; i++) {
  await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
  const result = await supabase.auth.getSession();
  sessionData = result.data;
  sessionError = result.error;
  if (sessionData?.session) break;
}
if (sessionError || !sessionData?.session) {
  console.error('[deeplink][native] Error obteniendo sesión después de 3 intentos:', sessionError);
  // ... resto del código de error
}
```

---

## 🎯 Ajuste 3: Usar window.location.replace() en lugar de window.location.hash

**Archivo**: `src/lib/deeplinks.ts`  
**Líneas**: 44, 70, 87, 90  
**Problema**: `window.location.hash` puede no disparar el HashRouter  
**Prioridad**: Crítica (probablemente la causa principal)

### Cambios:

#### Línea 44 (recovery):
```typescript
// ❌ ANTES:
window.location.hash = '#/set-new-password';

// ✅ DESPUÉS:
window.location.replace('#/set-new-password');
```

#### Línea 70 (register):
```typescript
// ❌ ANTES:
window.location.hash = '#/payment-gateway';

// ✅ DESPUÉS:
window.location.replace('#/payment-gateway');
```

#### Línea 87 (login con acceso):
```typescript
// ❌ ANTES:
window.location.hash = '#/dashboard';

// ✅ DESPUÉS:
window.location.replace('#/dashboard');
```

#### Línea 90 (login sin acceso):
```typescript
// ❌ ANTES:
window.location.hash = '#/mi-plan';

// ✅ DESPUÉS:
window.location.replace('#/mi-plan');
```

### Justificación:
`window.location.hash = '#/ruta'` agrega una entrada al historial pero puede no disparar el router si:
1. Ya estás en esa ruta (edge case)
2. El router no detecta el cambio de hash
3. Hay un guard o interceptor bloqueando

`window.location.replace('#/ruta')` fuerza la navegación sin agregar entrada al historial, lo cual es el comportamiento deseado después de un deep link (no quieres que el usuario pueda volver atrás al callback).

**Beneficios adicionales**:
- Evita que el usuario vea la URL del callback en el historial
- Previene loops de navegación si hay un redirect
- Es más confiable en WebViews de Capacitor

---

## 📝 Archivo completo con los cambios aplicados

```typescript
// src/lib/deeplinks.ts
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

let inited = false;

export function initAuthDeepLinks() {
  if (inited) return;
  inited = true;
  // Only meaningful on native platforms
  // ✅ AJUSTE 1: Corregir guard
  if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;

  // Elimina listeners duplicados antes de agregar el único
  App.removeAllListeners();

  App.addListener('appUrlOpen', async ({ url }) => {
    try { console.log('[appUrlOpen]', url); } catch {}
    try {
      // Normalizar y aceptar variantes de deep link
      const ENV_DEEP_LINK = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEEP_LINK) as string | undefined;
      const NATIVE_DEEP_LINK = ENV_DEEP_LINK || 'vitacard365://auth/callback';
      const normalized = url.split('#')[0].split('?')[0];
      const isAuthUrl =
        normalized === NATIVE_DEEP_LINK ||
        normalized === 'vitacard365://auth/callback' ||
        normalized === 'vitacard365://auth-callback' ||
        normalized === 'com.vitacard.app://auth-callback';

      // MercadoPago return: vitacard365://mp-return?status=success|failure|pending
      if (url.startsWith('vitacard365://mp-return')) {
        const parsed = new URL(url);
        const status = parsed.searchParams.get('status'); // success, failure, pending
        // Navega a la pantalla de resultado en la app
        if (typeof window !== 'undefined') {
          window.location.hash = '#/mp-result?status=' + status;
        }
        return;
      }
      // Recuperación de contraseña: vitacard365://auth/recovery
      if (url.startsWith('vitacard365://auth/recovery')) {
        console.log('[auth-recovery] deep link recibido:', url);
        if (typeof window !== 'undefined') {
          // ✅ AJUSTE 3: Usar replace en lugar de hash
          window.location.replace('#/set-new-password');
        }
        return;
      }
      // Deep link de login OAuth
      if (isAuthUrl) {
        try {
          console.log('[deeplink][native] OAuth callback recibido');
          
          // ✅ AJUSTE 2: Agregar delay antes de getSession
          // Dar tiempo a Supabase para procesar el PKCE callback
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Supabase maneja automáticamente el intercambio PKCE
          // Solo necesitamos obtener la sesión actual
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !sessionData?.session) {
            console.error('[deeplink][native] Error obteniendo sesión:', sessionError);
            if (typeof window !== 'undefined') {
              window.location.hash = '#/login';
            }
            return;
          }
          console.log('[deeplink][native] Sesión obtenida, user:', sessionData.session.user.id);
          // Leer el contexto guardado (login o register)
          const context = localStorage.getItem('oauth_context') || 'login';
          console.log('[deeplink][native] Contexto:', context);
          if (context === 'register') {
            // Usuario nuevo -> payment-gateway
            console.log('[deeplink][native] Navegando a: /payment-gateway');
            if (typeof window !== 'undefined') {
              // ✅ AJUSTE 3: Usar replace en lugar de hash
              window.location.replace('#/payment-gateway');
            }
            localStorage.removeItem('oauth_context');
            return;
          }
          // Context = login: consultar acceso
          console.log('[deeplink][native] Consultando acceso...');
          const { data: perfil, error: perfilError } = await supabase
            .from('profiles_certificado_v2')
            .select('acceso_activo')
            .eq('user_id', sessionData.session.user.id)
            .maybeSingle();
          const accesoActivo = !!perfil?.acceso_activo;
          console.log('[deeplink][native] Acceso activo:', accesoActivo);
          if (typeof window !== 'undefined') {
            if (accesoActivo) {
              console.log('[deeplink][native] Navegando a: /dashboard');
              // ✅ AJUSTE 3: Usar replace en lugar de hash
              window.location.replace('#/dashboard');
            } else {
              console.log('[deeplink][native] Navegando a: /mi-plan');
              // ✅ AJUSTE 3: Usar replace en lugar de hash
              window.location.replace('#/mi-plan');
            }
          }
          localStorage.removeItem('oauth_context');
        } catch (e) {
          console.error('[deeplink][native][catch]', e);
          if (typeof window !== 'undefined') {
            window.location.hash = '#/login';
          }
        }
        return;
      }
    } catch (e) {
      // ignore
    }
  });
}
```

---

## 🧪 TESTING

Después de aplicar los cambios, probar:

### Test 1: OAuth Login (usuario existente con acceso)
1. Abrir app → Login → Google
2. Seleccionar cuenta
3. **Esperado**: Navega a `/dashboard`
4. **Logs esperados**:
```
[appUrlOpen] vitacard365://auth/callback?code=...
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: xxx
[deeplink][native] Contexto: login
[deeplink][native] Consultando acceso...
[deeplink][native] Acceso activo: true
[deeplink][native] Navegando a: /dashboard
```

### Test 2: OAuth Login (usuario existente sin acceso)
1. Abrir app → Login → Google
2. Seleccionar cuenta de usuario sin pago
3. **Esperado**: Navega a `/mi-plan`
4. **Logs esperados**:
```
[appUrlOpen] vitacard365://auth/callback?code=...
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: xxx
[deeplink][native] Contexto: login
[deeplink][native] Consultando acceso...
[deeplink][native] Acceso activo: false
[deeplink][native] Navegando a: /mi-plan
```

### Test 3: OAuth Register (usuario nuevo)
1. Abrir app → Register → Google
2. Seleccionar cuenta nueva
3. **Esperado**: Navega a `/payment-gateway`
4. **Logs esperados**:
```
[appUrlOpen] vitacard365://auth/callback?code=...
[deeplink][native] OAuth callback recibido
[deeplink][native] Sesión obtenida, user: xxx
[deeplink][native] Contexto: register
[deeplink][native] Navegando a: /payment-gateway
```

### Test 4: Recovery (recuperación de contraseña)
1. Desde web, solicitar reset de contraseña
2. Abrir email en dispositivo Android
3. Tocar link de recuperación
4. **Esperado**: Navega a `/set-new-password`
5. **Logs esperados**:
```
[appUrlOpen] vitacard365://auth/recovery?token=...
[auth-recovery] deep link recibido: vitacard365://auth/recovery?token=...
```

---

## 📊 RESUMEN

| Ajuste | Prioridad | Impacto | Riesgo |
|--------|-----------|---------|--------|
| **1. Corregir guard** | Media | Bajo | Muy bajo (solo clarifica código) |
| **2. Agregar delay** | Alta | Alto | Bajo (puede mejorar significativamente) |
| **3. Usar replace()** | Crítica | Muy alto | Muy bajo (método estándar) |

**RECOMENDACIÓN**: Aplicar los 3 ajustes en orden. Si después del ajuste 3 sigue sin funcionar, implementar la versión robusta del ajuste 2 (retry con backoff).

---

## 🚀 COMANDOS PARA APLICAR Y PROBAR

```bash
# 1. Aplicar los cambios en src/lib/deeplinks.ts

# 2. Sincronizar con Capacitor
cd /home/ubuntu/VitaCard365
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android

# 4. En Android Studio:
#    - Build > Clean Project
#    - Build > Rebuild Project

# 5. Desinstalar app del dispositivo
adb uninstall com.vitacard365.app

# 6. Instalar nuevo APK desde Android Studio

# 7. Habilitar logs en tiempo real
adb logcat | grep -E "(appUrlOpen|deeplink|Capacitor)"

# 8. Probar los 4 casos de test
```

---

**FIN DE LOS AJUSTES PROPUESTOS**
