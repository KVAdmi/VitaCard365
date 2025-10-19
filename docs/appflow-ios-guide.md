# Guía rápida: Build iOS en Appflow y subir a TestFlight

Esta guía te permite publicar iOS sin una Mac usando Appflow (Ionic/Appflow) conectado a tu repo.

## Requisitos previos
- Appflow ya conectado al repo Git: rama `fix/ble-single-source`.
- Certificados de distribución y credenciales ya cargadas en Appflow (signing). No subas llaves al repo.
- Variables opcionales en Appflow (Build > Environment):
  - ROLLUP_SKIP_NODEJS_NATIVE=1
  - ROLLUP_SKIP_NATIVE=1

Nota: En el repo ya agregamos un postinstall que fuerza Rollup JS (scripts/force-rollup-js.js) y el build usa `cross-env` con esas flags, por lo que en general NO necesitas setearlas en Appflow.

## Pasos para disparar el build
1) Entra a Appflow > Builds > New build.
2) Selecciona:
   - App: VitaCard365
   - Branch: fix/ble-single-source
   - Commit: el último (fa6d1c1 o posterior)
   - Platform: iOS
   - Build type: App Store
3) Signing:
   - Usa el perfil/certificado que ya tienes cargado (Apple Distribution + provisioning App Store para `com.vitacard365.app`).
4) Destination:
   - App Store Connect/TestFlight (si ya lo tienes configurado con API Key o Apple ID).
5) Click “Start build”.

Durante “Install Dependencies” Appflow ejecutará `npm ci` y nuestro `postinstall` aplicará el parche de Rollup para evitar binarios nativos. Luego Vite construye con `vite.config.mjs`.

## Al finalizar el build
- Si configuraste Destination con App Store Connect, Appflow subirá automáticamente el .ipa a TestFlight.
- Si no, descarga el artefacto desde Appflow y súbelo manualmente desde App Store Connect > TestFlight.

## Verificación mínima
- Maps: la clave de iOS se inyecta vía Info.plist (GMS_API_KEY). En Appflow, puedes definir GMS_API_KEY como variable de entorno si deseas sobreescribir.
- Orientación: solo Portrait.
- Autenticación: sesión persistente con Capacitor Preferences.
- Pagos: UI compatible con Mercado Pago (no rompe).
- BLE: “Sincronizar mi rutina” muestra panel del reloj (HRS 0x180D) y el de aparatos de gimnasio (FTMS) se mantiene.

## Troubleshooting
- Falla en “Install Dependencies”: asegúrate de que el build use el commit más reciente de `fix/ble-single-source` (incluye package-lock con `hasInstallScript` y el postinstall).
- Si Rollup intenta cargar binarios nativos: agrega en Appflow las variables:
  - ROLLUP_SKIP_NODEJS_NATIVE=1
  - ROLLUP_SKIP_NATIVE=1
- Error de firma: revisa en Appflow > Signing que el .p12 y el provisioning App Store coinciden con el bundle id `com.vitacard365.app`.
- Si TestFlight no aparece: verifica en App Store Connect > Activity que se haya recibido la build; la indexación puede tardar unos minutos.

## Cambiar versión (opcional)
Si necesitas que App Store Connect reconozca una build “nueva”, incrementa versión o build number (MARKETING_VERSION / CURRENT_PROJECT_VERSION) antes de lanzar el build.

Listo: con esto puedes publicar iOS a TestFlight desde Appflow, sin Mac.
