# 🚀 GUÍA RÁPIDA: Testing de Deep Links

Esta guía te ayudará a probar los deep links nativos de VitaCard365 de forma rápida y efectiva.

---

## 📦 ARCHIVOS INCLUIDOS

1. **TESTING_SCRIPT.md** - Guía detallada con todos los pasos manuales
2. **test-deeplinks.sh** - Script bash automatizado para testing
3. **TESTING_QUICKSTART.md** - Esta guía (inicio rápido)

---

## ⚡ INICIO RÁPIDO (5 minutos)

### 1. Conectar dispositivo Android
```bash
# Conectar via USB y habilitar USB debugging
adb devices

# Debería mostrar tu dispositivo
```

### 2. Verificar configuración
```bash
cd /home/ubuntu/VitaCard365
./test-deeplinks.sh check
```

Esto verificará:
- ✅ Dispositivo conectado
- ✅ App instalada
- ✅ Intent-filters correctos en el Manifest

### 3. Ejecutar prueba rápida (simulación)
```bash
./test-deeplinks.sh simulation
```

Esto simula un deep link de OAuth sin necesidad de hacer OAuth real.

**Resultado esperado**:
```
✅ Deep link recibido
✅ Callback procesado
```

Si ves estos dos checks, el sistema básico funciona.

---

## 🧪 TESTING COMPLETO

### Opción A: Menú interactivo
```bash
./test-deeplinks.sh
```

Esto abrirá un menú donde puedes seleccionar qué caso probar:
1. OAuth Login (con acceso)
2. OAuth Login (sin acceso)
3. OAuth Register
4. Recovery
5. Simulación (sin OAuth real)
6. Ejecutar todos
7. Solo verificar configuración

### Opción B: Comando directo
```bash
# Probar caso específico
./test-deeplinks.sh login-activo
./test-deeplinks.sh login-inactivo
./test-deeplinks.sh register
./test-deeplinks.sh recovery

# Probar todos los casos
./test-deeplinks.sh all
```

---

## 📋 CASOS DE PRUEBA

### Caso 1: OAuth Login (con acceso activo)
**Usuario de prueba**: Cuenta con `acceso_activo = true`

**Comando**:
```bash
./test-deeplinks.sh login-activo
```

**Pasos**:
1. Script limpia datos y abre app
2. Te pide hacer OAuth manualmente
3. Selecciona cuenta con acceso activo
4. Script captura logs automáticamente
5. Analiza y muestra resultado

**Resultado esperado**: Navega a `/dashboard`

---

### Caso 2: OAuth Login (sin acceso activo)
**Usuario de prueba**: Cuenta con `acceso_activo = false`

**Comando**:
```bash
./test-deeplinks.sh login-inactivo
```

**Resultado esperado**: Navega a `/mi-plan`

---

### Caso 3: OAuth Register
**Usuario de prueba**: Cuenta nueva (no existe en Supabase)

**Comando**:
```bash
./test-deeplinks.sh register
```

**Pasos**:
1. Script abre app
2. Navega manualmente a "Registrarse"
3. Haz OAuth con cuenta nueva
4. Script captura y analiza

**Resultado esperado**: Navega a `/payment-gateway`

---

### Caso 4: Recovery
**Comando**:
```bash
./test-deeplinks.sh recovery
```

Este caso es automático (simula el deep link).

**Resultado esperado**: Navega a `#/set-new-password`

---

## 🔍 INTERPRETANDO RESULTADOS

### ✅ Todos los checks pasan
```
✅ Deep link recibido
✅ Callback procesado
✅ Sesión obtenida
✅ Contexto correcto: login
✅ Navegación correcta: /dashboard
✅ CASO 1 PASÓ
```

**Acción**: ¡Perfecto! El caso funciona correctamente.

---

### ❌ Deep link NO recibido
```
❌ Deep link NO recibido
❌ CASO 1 FALLÓ
```

**Problema**: El listener `appUrlOpen` no se está disparando.

**Diagnóstico**:
```bash
# Verificar Manifest
adb shell dumpsys package com.vitacard365.app | grep -A 5 "vitacard365://auth"

# Debe mostrar CapacitorActivity, NO MainActivity
```

**Solución**:
1. Verificar que el commit 9bf85ff está aplicado
2. Recompilar: `npx cap sync android`
3. Desinstalar completamente: `adb uninstall com.vitacard365.app`
4. Reinstalar APK nuevo

---

### ❌ Callback NO procesado
```
✅ Deep link recibido
❌ Callback NO procesado
```

**Problema**: El listener se dispara pero la lógica no se ejecuta.

**Diagnóstico**:
Ver logs completos (el script los muestra automáticamente).

**Solución**:
1. Verificar que `initAuthDeepLinks()` se ejecuta
2. Aplicar **Ajuste 1**: Corregir guard de `Capacitor.isNativePlatform`

---

### ❌ Sesión NO obtenida
```
✅ Deep link recibido
✅ Callback procesado
❌ Sesión NO obtenida
```

**Problema**: `supabase.auth.getSession()` falla o devuelve null.

**Solución**:
1. Aplicar **Ajuste 2**: Agregar delay de 300ms antes de `getSession()`
2. Verificar conectividad de red
3. Verificar configuración de Supabase

---

### ❌ Navegación incorrecta
```
✅ Deep link recibido
✅ Callback procesado
✅ Sesión obtenida
✅ Contexto correcto: login
❌ Navegación incorrecta (esperado: /dashboard)
```

**Problema**: La navegación con `window.location.hash` no funciona.

**Solución**:
1. Aplicar **Ajuste 3**: Cambiar a `window.location.replace()`

---

## 📊 LOGS DETALLADOS

Los logs se guardan en archivos:
- `logs_login_activo.txt`
- `logs_login_inactivo.txt`
- `logs_register.txt`
- `logs_recovery.txt`
- `logs_oauth_simulation.txt`

Para ver logs en tiempo real:
```bash
# Terminal separada
adb logcat | grep -E "(appUrlOpen|deeplink|Capacitor)"
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Problema: "No hay dispositivo Android conectado"
```bash
# Verificar conexión
adb devices

# Si no aparece, reconectar USB y habilitar USB debugging
# En Android: Configuración > Opciones de desarrollador > Depuración USB
```

### Problema: "VitaCard365 no está instalada"
```bash
# Instalar APK
adb install -r app-debug.apk

# O desde Android Studio:
# Run > Run 'app'
```

### Problema: Script no se ejecuta
```bash
# Dar permisos de ejecución
chmod +x test-deeplinks.sh

# Ejecutar
./test-deeplinks.sh
```

### Problema: Logs vacíos
```bash
# Limpiar logs de Android
adb logcat -c

# Ejecutar prueba nuevamente
./test-deeplinks.sh simulation
```

---

## 🎯 WORKFLOW RECOMENDADO

### Primera vez (Setup completo)
```bash
# 1. Verificar configuración
./test-deeplinks.sh check

# 2. Prueba rápida (simulación)
./test-deeplinks.sh simulation

# 3. Si pasa, probar con OAuth real
./test-deeplinks.sh login-activo

# 4. Si todo funciona, ejecutar suite completa
./test-deeplinks.sh all
```

### Después de aplicar fixes
```bash
# 1. Recompilar
npx cap sync android
npx cap open android
# En Android Studio: Clean + Rebuild

# 2. Desinstalar app vieja
adb uninstall com.vitacard365.app

# 3. Instalar app nueva (desde Android Studio)

# 4. Ejecutar suite completa
./test-deeplinks.sh all
```

### Testing diario
```bash
# Prueba rápida para verificar que nada se rompió
./test-deeplinks.sh simulation

# Si falla, ejecutar casos específicos
./test-deeplinks.sh login-activo
```

---

## 📝 CHECKLIST DE TESTING

Usa este checklist para documentar el estado:

- [ ] ✅ Configuración verificada (`./test-deeplinks.sh check`)
- [ ] ✅ Simulación pasa (`./test-deeplinks.sh simulation`)
- [ ] ✅ Login con acceso pasa (`./test-deeplinks.sh login-activo`)
- [ ] ✅ Login sin acceso pasa (`./test-deeplinks.sh login-inactivo`)
- [ ] ✅ Register pasa (`./test-deeplinks.sh register`)
- [ ] ✅ Recovery pasa (`./test-deeplinks.sh recovery`)
- [ ] ✅ Sesión persiste después de cerrar/reabrir app
- [ ] ✅ No hay errores en logs
- [ ] ✅ UX es fluida (sin delays perceptibles)

---

## 🚀 COMANDOS MÁS USADOS

```bash
# Verificar configuración
./test-deeplinks.sh check

# Prueba rápida
./test-deeplinks.sh simulation

# Menú interactivo
./test-deeplinks.sh

# Ejecutar todos los casos
./test-deeplinks.sh all

# Limpiar datos de la app
adb shell pm clear com.vitacard365.app

# Ver logs en tiempo real
adb logcat | grep -E "(appUrlOpen|deeplink)"

# Desinstalar app
adb uninstall com.vitacard365.app

# Instalar app
adb install -r app-debug.apk
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **TESTING_SCRIPT.md** - Guía detallada con pasos manuales
- **AUDIT_DEEPLINK_NATIVE.md** - Auditoría técnica completa
- **PROPOSED_FIX.md** - Los 3 ajustes mínimos propuestos

---

## 💡 TIPS

1. **Usa la simulación primero**: Es más rápido y no requiere OAuth real
2. **Limpia datos entre pruebas**: Evita estado inconsistente
3. **Captura logs siempre**: Son esenciales para diagnóstico
4. **Prueba en múltiples dispositivos**: Algunos issues son específicos del dispositivo
5. **Reinicia el dispositivo**: Si algo se comporta raro, un reinicio puede ayudar

---

## 🆘 SOPORTE

Si después de seguir esta guía los tests siguen fallando:

1. Revisa **AUDIT_DEEPLINK_NATIVE.md** sección "TROUBLESHOOTING"
2. Aplica los **3 ajustes mínimos** de **PROPOSED_FIX.md**
3. Captura logs completos y compártelos para análisis

---

**¡Buena suerte con el testing!** 🚀
