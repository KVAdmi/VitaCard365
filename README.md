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
