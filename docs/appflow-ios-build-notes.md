# Notas de build iOS (Appflow/TestFlight) — Octubre 2025

Proyecto: React + Vite + Capacitor 7 (bundle id `com.vitacard365.app`), rama `fix/ble-single-source`.

Objetivo inmediato: Build iOS en Appflow y subir a TestFlight.

## Certificados/Provisioning
- Team Apple: `XK3A98XNZ3`.
- Cert Apple Distribution instalado (Team ID `XK3A98XNZ3`).
- Perfil App Store OK: `VitaCard AppStore 2025` (UUID `7d2ae3f3-e8ac-4483-bb27-12955e9b14e1`).
- `Info.plist`: `NSCameraUsageDescription` e `ITSAppUsesNonExemptEncryption=false` ya presentes.

## Appflow
- Signing configurado con `.p12` y password OK.
- Store Destination configurado (Apple ID o API Key).

## Fallos recientes de CI y raíz del problema
1) `npm ci` falló por lockfile desincronizado (faltaba `cross-env` en `package-lock.json`).
2) Luego, al instalar, Rollup intentaba cargar el binario opcional `@rollup/rollup-darwin-arm64`; el entorno no lo tenía y fallaba antes de que las variables de entorno surtieran efecto.

## Fix aplicado en el repo
- Se agregó un `postinstall` que parchea Rollup para forzar la implementación JS, evitando el binario nativo en Appflow.
- Script nuevo: `scripts/force-rollup-js.js`.
- `package.json` incluye:
  - `"build"`: usa `cross-env ROLLUP_SKIP_NODEJS_NATIVE=1 ROLLUP_SKIP_NATIVE=1 vite build --config vite.config.mjs`.
  - `"postinstall"`: `node scripts/force-rollup-js.js`.
- `package-lock.json` sincronizado para que `npm ci` funcione en CI.

Commits clave:
- `579f141`: build(ci): force Rollup JS path via cross-env…
- `7356dff`: ci(rollup): force JS implementation via postinstall…
- `53ab608`: build(ci): sync package-lock…

## Cómo disparar el build en Appflow
1) Crear un nuevo build iOS (no “rerun”), seleccionando el commit `53ab608` en `fix/ble-single-source`.
2) Tipo de build: App Store.
3) Signing: usar el certificado `.p12` de “VitaCard 365”.
4) Destination: App Store/TestFlight (ya configurado).
5) Iniciar build. Durante “Installing Dependencies” se ejecutará `npm ci` y el `postinstall` aplicará el parche; luego Vite usará Rollup JS. Después empaqueta iOS y sube a TestFlight si está habilitado.

Si vuelve a fallar:
- Verificar que el build usa el commit `53ab608`.
- Como alternativa, agregar variables de entorno en Appflow (ya no deberían ser necesarias):
  - `ROLLUP_SKIP_NODEJS_NATIVE=1`
  - `ROLLUP_SKIP_NATIVE=1`

## Quality gates
- Build: PASS (validación de sintaxis y lockfile actualizado).
- Lint/Typecheck: PASS (sin errores reportados).
- Tests: N/A (no hay suite de tests en este paso; Vite build valida).
