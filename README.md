<!-- TODO: Implementa “KV Tester Gate” con estos requerimientos:

Contexto:
- App React + Vite + Capacitor.
- Supabase JS v2.
- Tenemos 2 Edge Functions ya desplegadas:
  - POST https://<PROJECT>.functions.supabase.co/redeem_kv_code
    body: { code: string, deviceId: string }
    resp: { ok: boolean, status?: "redeemed"|"already_redeemed", reason?: string }
  - POST https://<PROJECT>.functions.supabase.co/link_kv_redemption
    body: { userId: string, deviceId: string }
    resp: { ok: boolean }

Objetivo:
1) Página /invita: input de folio (default “VITAKV-UNICO”), botón “Entrar”.
   - Obtiene deviceId estable (Capacitor Preferences + Device.getId(); fallback crypto.randomUUID()).
   - Llama redeem_kv_code.
   - Si ok → sessionStorage.setItem('kv_gate','1') y navega a /auth.
   - Maneja errores: invalid_code, expired, closed, sold_out, bad_request (toast).

2) Hook useLinkKvAfterAuth:
   - Después de signIn/signUp, llama link_kv_redemption con session.user.id + deviceId.
   - No bloquea la UI si falla.

3) Hook useEntitlements(profile?):
   - isKVTester = kv_gate==='1' || profile.tipo_vita==='VITAKV' || profile.entitlements.includes('KV_BETA')
   - paywallEnabled = !isKVTester

4) Guard de rutas:
   - Si !paywallEnabled, ocultar botón de pagar.
   - En ruta /checkout: si !paywallEnabled → Navigate a /app.

5) DX:
   - Rutas y componentes en TypeScript, módulos ESM, React Router v6.
   - No dependas de libs extra (solo lo existente).
   - Agrega tipos básicos y comentarios JSDoc.

Criterios de aceptación:
- Con folio válido, /invita → /auth sin ver paywall; /checkout redirige a /app.
- Tras login, perfil queda marcado y sigue sin paywall.
- Si expira el folio o no se redime, se muestra paywall normal.

-->

# VitaCard365

## Android – permisos

- Agregados permisos para compatibilidad Android 13/14:
  - `FOREGROUND_SERVICE` y `FOREGROUND_SERVICE_LOCATION` para servicios en primer plano.
  - `POST_NOTIFICATIONS` para solicitar permisos de notificaciones.
- Deep link personalizado sin `autoVerify` (solo aplica para App Links https).
- Helper listo para solicitar permiso de notificaciones en Android 13+: `src/lib/notifications/ensurePermission.ts`.

## Releases

- Android (local):
  - AAB en: `android/app/build/outputs/bundle/release/app-release.aab` (al ejecutar bundleRelease).
  - Scripts sugeridos: `npm run release:android` (ver package.json).
- iOS (local):
  - Abrir en Xcode y archivar para TestFlight; o usar Fastlane con `npm run publish:ios:testflight`.

## Módulo Gym (nuevo)

- Catálogo, Constructor y Runner están disponibles bajo Fit.
- Esquema opcional para persistir circuitos y progreso en Supabase: ver `docs/gym-schema.md`.
