#!/usr/bin/env bash
set -euo pipefail

### 0) Salvavidas
git add -A || true
git commit -m "backup antes de forzar downgrade a Capacitor 6" || true
git switch -c fix/cap6-downgrade || git checkout -b fix/cap6-downgrade || true

### 1) Limpiar dependencias previas (v7) y lock
\rm -rf node_modules package-lock.json

# (opcional, ayuda en conflictos raros)
npm cache verify || true

### 2) Fijar versiones EXACTAS (sin ^ ni ~) a Capacitor 6 y plugins compatibles
# Core / CLI / plataformas
npm pkg set dependencies.@capacitor/core=6.1.2
npm pkg set devDependencies.@capacitor/cli=6.1.2
npm pkg set dependencies.@capacitor/ios=6.1.2
npm pkg set dependencies.@capacitor/android=6.1.2

# Plugins oficiales
npm pkg set dependencies.@capacitor/app=6.0.2
npm pkg set dependencies.@capacitor/device=6.0.2
npm pkg set dependencies.@capacitor/geolocation=6.0.2
npm pkg set dependencies.@capacitor/haptics=6.0.2
npm pkg set dependencies.@capacitor/keyboard=6.0.2
npm pkg set dependencies.@capacitor/preferences=6.0.2
npm pkg set dependencies.@capacitor/share=6.0.2
npm pkg set dependencies.@capacitor/filesystem=6.0.3

# Plugins extra (ajusta si no los usas)
npm pkg set dependencies.@capacitor/google-maps=6.0.1
npm pkg set dependencies.@capacitor-community/bluetooth-le=6.0.0
# Si usas push:
# npm pkg set dependencies.@capacitor/push-notifications=6.0.2

### 3) Instalar dependencias forzando la resolución de peers
npm i --legacy-peer-deps

### 4) Sincronizar plataformas (no toca tu código nativo)
npx cap add android || true
npx cap add ios || true
npx cap sync android
npx cap sync ios

### 5) ANDROID – comprobación rápida (asegura que no “tronamos” Android)
pushd android >/dev/null
./gradlew clean
./gradlew :app:assembleDebug
# opcional: release sin firmar
# ./gradlew :app:assembleRelease
popd >/dev/null

### 6) iOS – pods limpios + DerivedData + archive sin firma (compatible con Xcode 14)
pushd ios/App >/dev/null
\rm -rf Pods Podfile.lock
pod repo update
pod install
popd >/dev/null

\rm -rf ~/Library/Developer/Xcode/DerivedData/*

pushd ios/App >/dev/null
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -sdk iphoneos -destination "generic/platform=iOS" \
  CODE_SIGNING_ALLOWED=NO clean archive \
  -archivePath "$PWD/build/Cap6-Sanity.xcarchive"
popd >/dev/null

### 7) Commit de estado estable
git add -A
git commit -m "Capacitor 6 alineado + Android debug OK + iOS archive sin firma OK"

echo "✅ Downgrade completado. Android e iOS listos. Sigue con el build firmado en Codemagic."
