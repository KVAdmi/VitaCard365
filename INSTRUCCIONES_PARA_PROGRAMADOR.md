# 📋 INSTRUCCIONES PARA EL PROGRAMADOR

## 🎯 RESUMEN EJECUTIVO

**NO hice cambios al código del proyecto**. Solo generé **documentación y herramientas de testing**.

Tu commit `9bf85ff` (fix del AndroidManifest) está correcto y ya aplicado en la rama `release/ses-emails-vitacard`.

---

## 📦 LO QUE GENERÉ

He creado **5 archivos nuevos** con documentación y herramientas:

1. **AUDIT_DEEPLINK_NATIVE.md** - Auditoría técnica completa
2. **PROPOSED_FIX.md** - 3 ajustes mínimos al código (pendientes de aplicar)
3. **TESTING_SCRIPT.md** - Guía detallada de testing manual
4. **TESTING_QUICKSTART.md** - Guía rápida de inicio
5. **test-deeplinks.sh** - Script bash automatizado para testing

**Estos archivos NO están en Git todavía** (son archivos nuevos sin commit).

---

## 🔍 ESTADO ACTUAL DEL REPOSITORIO

```
HEAD detached at 9bf85ff
Branch actual: release/ses-emails-vitacard (commit 9bf85ff)
```

El commit `9bf85ff` contiene el fix del AndroidManifest (eliminar intent-filter duplicado de MainActivity).

---

## 📥 CÓMO OBTENER LOS ARCHIVOS

### Opción 1: Descargar desde la interfaz de Manus
Los 5 archivos están adjuntos en los mensajes anteriores. Puedes descargarlos directamente.

### Opción 2: Crear un commit con los archivos de documentación
Si quieres tener estos archivos en el repositorio:

```bash
# 1. Cambiar a la rama fix/oauth-routing-guard-safe
git checkout fix/oauth-routing-guard-safe

# 2. Agregar los archivos de documentación
git add AUDIT_DEEPLINK_NATIVE.md
git add PROPOSED_FIX.md
git add TESTING_SCRIPT.md
git add TESTING_QUICKSTART.md
git add test-deeplinks.sh

# 3. Hacer commit
git commit -m "docs: add deep link testing documentation and scripts"

# 4. Push (opcional)
git push origin fix/oauth-routing-guard-safe
```

---

## 🔧 LO QUE DEBES HACER AHORA

### PASO 1: Aplicar los 3 ajustes mínimos al código

Los ajustes están documentados en **PROPOSED_FIX.md**. Aquí el resumen:

#### Ajuste 1: Corregir guard en `src/lib/deeplinks.ts` línea 11
```typescript
// ANTES:
if (!(Capacitor.isNativePlatform && Capacitor.isNativePlatform())) return;

// DESPUÉS:
if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;
```

#### Ajuste 2: Agregar delay en `src/lib/deeplinks.ts` línea 54
```typescript
// AGREGAR ANTES de getSession():
await new Promise(resolve => setTimeout(resolve, 300));

// Luego:
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
```

#### Ajuste 3: Cambiar navegación en `src/lib/deeplinks.ts` líneas 44, 70, 87, 90
```typescript
// ANTES (4 lugares):
window.location.hash = '#/dashboard';

// DESPUÉS:
window.location.replace('#/dashboard');

// Aplicar en las 4 líneas:
// - Línea 44: window.location.replace('#/set-new-password');
// - Línea 70: window.location.replace('#/payment-gateway');
// - Línea 87: window.location.replace('#/dashboard');
// - Línea 90: window.location.replace('#/mi-plan');
```

---

### PASO 2: Hacer commit de los cambios

```bash
# 1. Asegurarte de estar en la rama correcta
git checkout fix/oauth-routing-guard-safe

# 2. Ver los cambios
git diff src/lib/deeplinks.ts

# 3. Agregar el archivo modificado
git add src/lib/deeplinks.ts

# 4. Hacer commit
git commit -m "fix(native): apply 3 minimal fixes for deep link navigation

- Fix Capacitor.isNativePlatform guard syntax
- Add 300ms delay before getSession() for PKCE processing
- Replace window.location.hash with window.location.replace() for reliable navigation"

# 5. Push
git push origin fix/oauth-routing-guard-safe
```

---

### PASO 3: Recompilar y probar

```bash
# 1. Sincronizar con Capacitor
npx cap sync android

# 2. Abrir en Android Studio
npx cap open android

# 3. En Android Studio:
#    - Build > Clean Project
#    - Build > Rebuild Project

# 4. Desinstalar app del dispositivo
adb uninstall com.vitacard365.app

# 5. Instalar nuevo APK desde Android Studio
#    - Run > Run 'app'

# 6. Ejecutar tests
./test-deeplinks.sh check
./test-deeplinks.sh simulation
```

---

## 🧪 TESTING

### Prueba rápida (5 minutos)
```bash
# Verificar configuración
./test-deeplinks.sh check

# Prueba sin OAuth real
./test-deeplinks.sh simulation
```

### Prueba completa
```bash
# Menú interactivo
./test-deeplinks.sh

# O ejecutar todos los casos
./test-deeplinks.sh all
```

---

## 📊 ESTRUCTURA DE RAMAS

```
main
  └─ fix/oauth-routing-guard-safe (rama de trabajo)
       └─ Aplicar los 3 ajustes aquí

release/ses-emails-vitacard (tiene el commit 9bf85ff del Manifest)
  └─ Este commit ya está correcto, no tocar
```

**Recomendación**: Trabaja en `fix/oauth-routing-guard-safe` y luego mergea a `main` cuando todo funcione.

---

## 🎯 WORKFLOW COMPLETO

```bash
# 1. Ir a la rama de trabajo
git checkout fix/oauth-routing-guard-safe

# 2. Aplicar los 3 ajustes en src/lib/deeplinks.ts
#    (editar manualmente el archivo)

# 3. Commit
git add src/lib/deeplinks.ts
git commit -m "fix(native): apply 3 minimal fixes for deep link navigation"

# 4. Opcional: Agregar documentación
git add AUDIT_DEEPLINK_NATIVE.md PROPOSED_FIX.md TESTING_*.md test-deeplinks.sh
git commit -m "docs: add deep link testing documentation and scripts"

# 5. Push
git push origin fix/oauth-routing-guard-safe

# 6. Recompilar
npx cap sync android
npx cap open android
# Clean + Rebuild en Android Studio

# 7. Desinstalar e instalar
adb uninstall com.vitacard365.app
# Instalar desde Android Studio

# 8. Probar
./test-deeplinks.sh all

# 9. Si todo funciona, mergear a main
git checkout main
git merge fix/oauth-routing-guard-safe
git push origin main
```

---

## ⚠️ IMPORTANTE

1. **NO toques la rama `release/ses-emails-vitacard`** - El commit 9bf85ff del Manifest ya está correcto
2. **Trabaja en `fix/oauth-routing-guard-safe`** - Aplica los 3 ajustes aquí
3. **Desinstala completamente la app** antes de instalar la nueva (no solo actualizar)
4. **Captura logs** durante las pruebas: `adb logcat | grep -E "(appUrlOpen|deeplink)"`

---

## 📝 CHECKLIST

- [ ] Checkout a `fix/oauth-routing-guard-safe`
- [ ] Aplicar Ajuste 1 (guard de Capacitor)
- [ ] Aplicar Ajuste 2 (delay de 300ms)
- [ ] Aplicar Ajuste 3 (replace en 4 líneas)
- [ ] Commit de los cambios
- [ ] Recompilar: `npx cap sync android`
- [ ] Clean + Rebuild en Android Studio
- [ ] Desinstalar app: `adb uninstall com.vitacard365.app`
- [ ] Instalar nuevo APK
- [ ] Ejecutar: `./test-deeplinks.sh check`
- [ ] Ejecutar: `./test-deeplinks.sh simulation`
- [ ] Ejecutar: `./test-deeplinks.sh all`
- [ ] Verificar que los 4 casos pasan
- [ ] Mergear a main si todo funciona

---

## 🆘 SI ALGO FALLA

1. Revisa **AUDIT_DEEPLINK_NATIVE.md** sección "TROUBLESHOOTING"
2. Captura logs completos: `adb logcat > logs_completos.txt`
3. Ejecuta: `./test-deeplinks.sh check` para verificar configuración
4. Comparte los logs para análisis

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

- **PROPOSED_FIX.md** - Código exacto de los 3 ajustes
- **TESTING_QUICKSTART.md** - Inicio rápido de testing
- **TESTING_SCRIPT.md** - Guía detallada de testing
- **AUDIT_DEEPLINK_NATIVE.md** - Análisis técnico completo

---

**¡Listo! Con estas instrucciones tu programador puede aplicar los cambios y probar.** 🚀
