#!/usr/bin/env bash
set -euo pipefail

### 0) Salvavidas: commit y rama nueva
git add -A
git commit -m "backup antes de alinear a Capacitor 6 (iOS/Xcode14 compatible)" || true
git switch -c fix/cap6-align || git checkout -b fix/cap6-align

### 1) Matriz Capacitor 6 (core/cli/ios/android) + plugins v6 exactos
npm i -E @capacitor/core@6.1.2 @capacitor/cli@6.1.2 @capacitor/ios@6.1.2 @capacitor/android@6.1.2

npm i -E \
  @capacitor/app@6.0.2 \
  @capacitor/device@6.0.2 \
  @capacitor/geolocation@6.0.2 \
  @capacitor/haptics@6.0.2 \
  @capacitor/keyboard@6.0.2 \
  @capacitor/preferences@6.0.2 \
  @capacitor/share@6.0.2 \
  @capacitor/filesystem@6.0.3

# Plugins extra compatibles con Cap 6
npm i -E @capacitor/google-maps@6.0.1 @capacitor-community/bluetooth-le@6.0.0

# (Si usas push notifications)
# npm i -E @capacitor/push-notifications@6.0.2

### 2) Sync de plataformas (no toca tu código nativo)
npx cap add android || true
npx cap add ios || true
npx cap sync android
npx cap sync ios

### 3) ANDROID — sanity check (no rompemos nada)
pushd android >/dev/null
./gradlew clean
./gradlew :app:assembleDebug
# opcional: release sin firmar
# ./gradlew :app:assembleRelease
popd >/dev/null

### 4) iOS — limpiar Pods y DerivedData, build sin firma (Xcode 14 friendly)
pushd ios/App >/dev/null
rm -rf Pods Podfile.lock
pod repo update
pod install
popd >/dev/null

# borrar cachés de compilación de Xcode (seguro)
\rm -rf ~/Library/Developer/Xcode/DerivedData/*

# archive sin firma: valida que el código ya está sano en Xcode 14
pushd ios/App >/dev/null
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -sdk iphoneos -destination "generic/platform=iOS" \
  CODE_SIGNING_ALLOWED=NO clean archive \
  -archivePath "$PWD/build/Cap6-Sanity.xcarchive"
popd >/dev/null

### 5) Commit del cambio estable
git add -A
git commit -m "alineación completa a Capacitor 6 + sanity builds OK"

echo "✅ Capacitor 6 alineado. Android y iOS compilan. Listo para firmar en Codemagic."
