# iOS Build — Guía rápida (local)
## Requisitos
- Xcode instalado y abierto una vez.
- Ruby + Bundler, CocoaPods.

## Pasos en Mac
```bash
npm run ios:setup
open ios/App/App.xcworkspace
# En Xcode: Team, Bundle ID, Capabilities
# Product → Archive → Distribute → App Store Connect → Upload
```

Permisos (agregar en Info.plist según uso)

NSLocationWhenInUseUsageDescription

NSBluetoothAlwaysUsageDescription

NSBluetoothPeripheralUsageDescription

(Opc.) NSHealthShareUsageDescription, NSHealthUpdateUsageDescription

Notas

No subir Pods/ al repo.

Fastlane queda en skeleton, sin credenciales.
