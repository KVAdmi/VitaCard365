# Build iOS — VitaCard365
# Build iOS — VitaCard365

Este documento describe los pasos recomendados para preparar y construir la app iOS localmente o en CI.

Requisitos (macOS):
- Xcode (última versión compatible)
- CocoaPods (o usar Bundler)
- Ruby + Bundler (opcional, recomendado para reproducibilidad con Fastlane)
- node + npm/yarn

Pasos locales mínimos:

1. Instalar dependencias JS desde la raíz:

```bash
npm install
```

2. Generar los assets web (Vite) y sincronizar con Capacitor:

```bash
npm run build
npx cap sync ios
```

3. Instalar pods:

Si usas Bundler (recomendado):

```bash
cd ios
bundle install
cd App
bundle exec pod install
```

O sin Bundler:

```bash
cd ios/App
pod install
```

4. Abrir workspace en Xcode y firmar:

```bash
npx cap open ios
```

- En Xcode abre `ios/App/App.xcworkspace` (debería abrirse automáticamente).
- En el target `App` > Signing & Capabilities: selecciona tu Team de Apple Developer.
- Ajusta Bundle Identifier si hace falta (actual: `com.vitacard365.app`).
- Verifica que las capacidades (HealthKit, Background Modes, etc.) están activadas si la app las requiere.

5. Archivar y subir (desde Xcode) o usar Fastlane (opcional):

- Archivar: Product → Archive → Organizer → Upload to App Store.
- Fastlane (si está configurado): en `ios`:

```bash
bundle install
bundle exec fastlane beta
```

Notas de seguridad y no tocar claves:
- No añadas certificados o profiles en texto plano al repositorio.
- Usa secretos del runner (GitHub Actions / Appflow / Bitrise) para almacenar certificados/profiles y credenciales App Store Connect.

CI (breve recomendación):
- Usa `macos-latest` en GitHub Actions o servicios como Bitrise/Appflow.
- Pasos CI típicos:
  - checkout
  - setup node
  - npm ci && npm run build
  - npx cap sync ios
  - cd ios/App && pod install
  - xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -archivePath ./build/App.xcarchive archive
  - xcodebuild -exportArchive ... o usar fastlane gym + pilot

Si quieres, puedo añadir un ejemplo de workflow de GitHub Actions adaptado.

Permisos
-------

Las siguientes keys pueden (y en este proyecto deben) existir en `Info.plist`. No las inyectes desde el repo — revisa y edita en Xcode si hace falta:

- `NSLocationWhenInUseUsageDescription` — texto explicando por qué la app usa la ubicación cuando está en uso.
- `NSBluetoothAlwaysUsageDescription` — texto explicando uso continuo de Bluetooth (si aplica).
- `NSBluetoothPeripheralUsageDescription` — texto explicando uso de Bluetooth para periféricos.
- Opcionalmente, si usas HealthKit:
  - `NSHealthShareUsageDescription`
  - `NSHealthUpdateUsageDescription`

Checklist (hacer manualmente en Xcode):

1. Abrir `ios/App/App.xcworkspace` en Xcode.
2. Seleccionar el target `App` > Signing & Capabilities.
3. En la sección Capabilities añadir/activar según necesidad:
   - Location (When In Use) — si tu app usa ubicación.
   - Background Modes → Location updates — si necesitas location en background.
   - Bluetooth (no hay un capability ‘Bluetooth’ general; activar los permisos y Background Modes → Uses Bluetooth LE / bluetooth-central según el caso).
   - HealthKit — si la app usa HealthKit (añade entitlements y solicita permisos en runtime).
4. Confirmar que `Info.plist` contiene las keys de uso (NS*UsageDescription) con textos claros.

Podfile y plataforma
--------------------

El `Podfile` en `ios/App/Podfile` especifica la plataforma iOS. Actualmente el proyecto usa:

```ruby
platform :ios, '14.0'
```

Recomendación: muchas librerías y Xcode recientes requieren iOS 15+. Si tu objetivo es iOS 15+ (recomendado), actualiza esta línea a `platform :ios, '15.0'` antes de ejecutar `pod install` en la Mac. No lo cambio automáticamente aquí para evitar efectos secundarios; si quieres que lo haga en una rama aparte, lo hago tras tu confirmación.

