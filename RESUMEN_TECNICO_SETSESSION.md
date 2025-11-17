# 🔍 RESUMEN TÉCNICO: Diagnóstico de setSession() en OAuth Nativo

**Fecha**: 16 de noviembre de 2025  
**Rama**: `fix/oauth-routing-guard-safe`  
**Último commit**: `a5a2525` - debug: add comprehensive logging around setSession call

---

## 📊 ESTADO ACTUAL CONFIRMADO

### ✅ Lo que SÍ funciona:

1. **Deep link llega correctamente**
   - URL recibida: `vitacard365://auth/callback#access_token=...&refresh_token=...`
   - El AndroidManifest está configurado correctamente
   - El listener `appUrlOpen` se dispara

2. **Tokens se extraen correctamente**
   - `accessToken length`: ~500+ caracteres
   - `refreshToken length`: 12 caracteres
   - `expiresIn`: 3600 segundos

3. **El código llega hasta setSession()**
   - Los logs muestran: `[deeplink][native][DEBUG] Intentando setSession...`
   - Esto confirma que el flujo de parsing y extracción funciona

### ❌ Lo que NO funciona:

1. **No hay logs DESPUÉS de "Intentando setSession..."**
   - No aparece: `[deeplink][native][DEBUG] Llamando supabase.auth.setSession...`
   - No aparece: `[deeplink][native][DEBUG] setSession completado`
   - No aparece: `[deeplink][native][SUCCESS] Sesión establecida correctamente`

2. **La app regresa a onboarding/login**
   - Después del OAuth, la sesión no persiste
   - `ProtectedRoute` detecta que no hay sesión y redirige a login

---

## 🔧 CAMBIOS APLICADOS EN ESTE COMMIT

### Archivo modificado: `src/lib/deeplinks.ts`

Se agregaron **logs exhaustivos** alrededor de `setSession()`:

#### Antes de setSession:
```typescript
console.log('[deeplink][native][DEBUG] Tokens para setSession:', { 
  hasAccessToken: !!accessToken, 
  accessTokenLength: accessToken?.length || 0,
  hasRefreshToken: !!refreshToken,
  refreshTokenLength: refreshToken?.length || 0
});
```

#### Durante setSession:
```typescript
console.log('[deeplink][native][DEBUG] Llamando supabase.auth.setSession...');
const { data, error } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken,
});

console.log('[deeplink][native][DEBUG] setSession completado');
console.log('[deeplink][native][DEBUG] setSession data:', {
  hasData: !!data,
  hasSession: !!data?.session,
  hasUser: !!data?.session?.user,
  userId: data?.session?.user?.id,
  userEmail: data?.session?.user?.email
});
console.log('[deeplink][native][DEBUG] setSession error:', {
  hasError: !!error,
  errorMessage: error?.message,
  errorName: error?.name,
  errorStatus: (error as any)?.status
});
```

#### Manejo de errores:
```typescript
if (error) {
  console.error('[deeplink][native][ERROR] setSession devolvió error:', JSON.stringify(error));
}
if (data?.session) {
  console.log('[deeplink][native][SUCCESS] Sesión establecida correctamente, user:', data.session.user.id);
}
```

#### Catch de excepciones:
```typescript
catch (setSessionErr: any) {
  console.error('[deeplink][native][ERROR] setSession lanzó excepción:', setSessionErr);
  console.error('[deeplink][native][ERROR] Exception details:', {
    message: setSessionErr?.message,
    name: setSessionErr?.name,
    stack: setSessionErr?.stack?.substring(0, 200)
  });
  sessionError = setSessionErr as any;
}
```

#### Después de setSession:
```typescript
console.log('[deeplink][native][DEBUG] Después de setSession, sessionData:', {
  hasSessionData: !!sessionData,
  hasSession: !!sessionData?.session,
  hasError: !!sessionError
});
```

---

## ✅ VERIFICACIONES REALIZADAS

### 1. Cliente de Supabase
- ✅ `deeplinks.ts` y `AuthContext.jsx` usan **el mismo cliente**
- ✅ Ambos importan de `./supabaseClient` (misma instancia)
- ✅ No hay conflictos de configuración

### 2. Flujo de navegación
- ✅ El código después de `setSession()` está intacto
- ✅ Las rutas de navegación son las correctas:
  - Login con acceso → `/dashboard`
  - Login sin acceso → `/mi-plan`
  - Registro → `/payment-gateway`
  - Recovery → `#/set-new-password`

---

## 📋 PRÓXIMOS PASOS PARA TESTING

### 1. Recompilar con el nuevo código

```bash
# Pull del último commit
git pull origin fix/oauth-routing-guard-safe

# Verificar commit
git log --oneline -1
# DEBE mostrar: a5a2525 debug: add comprehensive logging around setSession call

# Limpiar cachés
rm -rf node_modules/.vite
rm -rf android/app/build

# Recompilar
npm run build
npx cap sync android
npx cap open android

# En Android Studio:
# - Build > Clean Project
# - Build > Rebuild Project
# - Run 'app' o generar APK
```

### 2. Desinstalar app vieja

```bash
adb uninstall com.vitacard365.app
```

### 3. Instalar nuevo APK

### 4. Hacer login con Google UNA VEZ

### 5. Capturar logs completos

```bash
adb logcat | grep -E "deeplink|DEBUG|ERROR|SUCCESS" > logs_setsession_detailed.txt
```

---

## 🎯 LOGS ESPERADOS

### Escenario 1: setSession funciona correctamente

```
[deeplink][native][DEBUG] Intentando setSession...
[deeplink][native][DEBUG] Tokens para setSession: { hasAccessToken: true, accessTokenLength: 523, hasRefreshToken: true, refreshTokenLength: 12 }
[deeplink][native][DEBUG] Llamando supabase.auth.setSession...
[deeplink][native][DEBUG] setSession completado
[deeplink][native][DEBUG] setSession data: { hasData: true, hasSession: true, hasUser: true, userId: "xxx", userEmail: "xxx@gmail.com" }
[deeplink][native][DEBUG] setSession error: { hasError: false, errorMessage: undefined, errorName: undefined, errorStatus: undefined }
[deeplink][native][SUCCESS] Sesión establecida correctamente, user: xxx
[deeplink][native][DEBUG] Después de setSession, sessionData: { hasSessionData: true, hasSession: true, hasError: false }
[deeplink][native][DEBUG] Verificando sesión: { hasError: false, hasData: true, hasSession: true, userId: "xxx" }
[deeplink][native] Sesión obtenida, user: xxx
[deeplink][native] Contexto: login
[deeplink][native] Consultando acceso...
[deeplink][native] Acceso activo: true
[deeplink][native] Navegando a: /dashboard
```

### Escenario 2: setSession devuelve error

```
[deeplink][native][DEBUG] Intentando setSession...
[deeplink][native][DEBUG] Tokens para setSession: { ... }
[deeplink][native][DEBUG] Llamando supabase.auth.setSession...
[deeplink][native][DEBUG] setSession completado
[deeplink][native][DEBUG] setSession data: { hasData: true, hasSession: false, ... }
[deeplink][native][DEBUG] setSession error: { hasError: true, errorMessage: "Invalid token", errorName: "AuthError", errorStatus: 400 }
[deeplink][native][ERROR] setSession devolvió error: {"message":"Invalid token","name":"AuthError","status":400}
```

### Escenario 3: setSession lanza excepción

```
[deeplink][native][DEBUG] Intentando setSession...
[deeplink][native][DEBUG] Tokens para setSession: { ... }
[deeplink][native][DEBUG] Llamando supabase.auth.setSession...
[deeplink][native][ERROR] setSession lanzó excepción: TypeError: Cannot read property 'setSession' of undefined
[deeplink][native][ERROR] Exception details: { message: "Cannot read property 'setSession' of undefined", name: "TypeError", stack: "..." }
```

### Escenario 4: El código se detiene antes de setSession (problema actual)

```
[deeplink][native][DEBUG] Intentando setSession...
[deeplink][native][DEBUG] Tokens para setSession: { ... }
(NO HAY MÁS LOGS)
```

---

## 🔍 DIAGNÓSTICO SEGÚN LOS LOGS

### Si aparece "Llamando supabase.auth.setSession..." pero NO "setSession completado":
- **Causa**: `setSession()` está colgándose o tardando infinitamente
- **Solución**: Agregar timeout o revisar configuración de red en Capacitor

### Si aparece "setSession completado" con error:
- **Causa**: Los tokens son inválidos, expirados, o hay problema de audience/issuer
- **Solución**: Revisar configuración de OAuth en Supabase o Google Console

### Si aparece "setSession lanzó excepción":
- **Causa**: Error de JavaScript (cliente no inicializado, método no disponible, etc.)
- **Solución**: Revisar inicialización del cliente de Supabase

### Si NO aparece "Llamando supabase.auth.setSession...":
- **Causa**: El código se está deteniendo ANTES de la llamada
- **Solución**: Revisar si hay algún guard o condición que esté bloqueando

---

## 📝 INFORMACIÓN PARA PATTY Y ALE

### Qué se cambió:
- **Archivo**: `src/lib/deeplinks.ts`
- **Cambio**: Se agregaron ~40 líneas de logs detallados alrededor de `setSession()`
- **Objetivo**: Identificar exactamente dónde y por qué falla `setSession()`

### Qué NO se cambió:
- ❌ No se modificó la lógica de navegación
- ❌ No se cambió la configuración de Supabase
- ❌ No se modificó `AuthContext.jsx` ni `ProtectedRoute.jsx`
- ❌ No se cambiaron las rutas finales

### Qué se necesita ahora:
1. **Recompilar** la app con el commit `a5a2525`
2. **Probar** login con Google en Android
3. **Capturar** los logs completos
4. **Enviar** los logs que aparecen después de `[deeplink][native][DEBUG] Intentando setSession...`

### Resultado esperado:
- Si `setSession()` funciona: Veremos logs de éxito y la navegación debería funcionar
- Si `setSession()` falla: Veremos el error exacto de Supabase
- Si `setSession()` lanza excepción: Veremos el stack trace completo

---

## 🚨 NOTAS IMPORTANTES

1. **Es crítico recompilar completamente**
   - No basta con `npm run build`
   - Hay que hacer Clean + Rebuild en Android Studio
   - Hay que desinstalar la app vieja antes de instalar la nueva

2. **El bundle debe ser nuevo**
   - Verificar en logs que el archivo JS sea diferente al anterior
   - Anterior: `index-CETyzWji.js`
   - Nuevo: Debe ser un hash diferente

3. **Los logs son la clave**
   - Sin los logs de DEBUG, no podemos diagnosticar
   - Es importante capturar TODO el output después de "Intentando setSession..."

---

## 📞 CONTACTO

Si después de probar con este commit siguen sin aparecer los logs de DEBUG después de "Intentando setSession...", entonces el problema es más profundo y necesitaremos:

1. Revisar si hay algún error de compilación de TypeScript
2. Verificar si Capacitor está bloqueando la ejecución
3. Revisar si hay algún timeout o límite de memoria
4. Considerar usar una estrategia diferente (como `exchangeCodeForSession` en lugar de `setSession`)

---

**Commit listo para testing**: `a5a2525`  
**Rama**: `fix/oauth-routing-guard-safe`  
**Próximo paso**: Recompilar, probar y enviar logs
