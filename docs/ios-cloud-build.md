# iOS: Build en la nube (sin Mac)

Este repo incluye un workflow de GitHub Actions (`.github/workflows/ios-build.yml`) que permite compilar la app iOS y subirla a TestFlight desde un runner macOS en la nube.

## Requisitos previos
- Cuenta de Apple Developer (99 USD/año) y acceso a App Store Connect.
- Identificador de app (Bundle ID): `com.vitacard365.app` (debe existir en Apple Developer).
- Certificado iOS Distribution (.p12) y Contraseña del .p12.
- Perfil de aprovisionamiento App Store (nombre del perfil) asociado al bundle id y a tu certificado.
- App Store Connect API Key (Issuer ID, Key ID y clave .p8) para subir a TestFlight.

## Configurar secretos en GitHub
En Settings > Secrets and variables > Actions, agregar:

- IOS_CERT_P12_BASE64: contenido del .p12 en base64
- IOS_CERT_PASSWORD: contraseña del .p12
- IOS_PROVISIONING_PROFILE_BASE64: contenido del .mobileprovision en base64
- IOS_PROFILE_NAME: nombre del perfil de aprovisionamiento (tal cual aparece en Apple Developer)
- IOS_BUNDLE_ID: com.vitacard365.app
- APPLE_TEAM_ID: tu Team ID (10 caracteres)
- ASC_ISSUER_ID: Issuer ID de App Store Connect API
- ASC_KEY_ID: Key ID de App Store Connect API
- ASC_API_KEY: contenido del archivo .p8 (clave privada) 

Cómo obtener base64 (ejecuta en tu máquina local):

```powershell
# .p12 a base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes('certificado.p12')) | Set-Content cert.p12.b64
# .mobileprovision a base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes('perfil.mobileprovision')) | Set-Content perfil.mobileprovision.b64
```

Copia el contenido de `cert.p12.b64` y `perfil.mobileprovision.b64` a sus secretos correspondientes.

## Ejecutar el workflow
- Ve a la pestaña Actions en GitHub.
- Selecciona “iOS Build and TestFlight”.
- Click en “Run workflow” (puedes dejar el scheme por defecto `App`).

El flujo:
1. Instala dependencias y compila web con Vite.
2. `npx cap sync ios` para sincronizar Capacitor.
3. Instala CocoaPods y corre `pod install`.
4. Importa certificados y perfil de aprovisionamiento.
5. Hace `xcodebuild archive` con firma manual.
6. Exporta el `.ipa` con `exportOptions.plist` (método app-store).
7. Sube a TestFlight con las credenciales de App Store Connect API.
8. Guarda el `.ipa` como artefacto de GitHub.

## Notas
- Si prefieres Fastlane, podemos migrar el paso de build/upload a `fastlane gym` + `fastlane pilot`.
- Asegúrate de que el perfil de aprovisionamiento corresponde al bundle id `com.vitacard365.app` y al certificado cargado.
- Puedes cambiar el `MARKETING_VERSION` y `CURRENT_PROJECT_VERSION` desde Xcode (o editar el proyecto) para nuevas versiones.
- Para notificaciones push, necesitarás subir un `Apple Push Key` y configurar capabilities (si aplica).
