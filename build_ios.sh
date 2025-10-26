#!/usr/bin/env bash
set -euo pipefail

# ====== CONFIGURA AQUÍ ======
TEAM_ID="XK3A98XNZ3"                   # Tu Team ID (ya lo vi en tus logs)
BUNDLE_ID="com.vitacard365.app"        # Bundle id
IOS_ROOT="ios/App"                     # Carpeta iOS (Capacitor)
WORKSPACE="App.xcworkspace"
SCHEME="App"
CONFIG="Release"
EXPORT_METHOD="app-store"              # "app-store" | "ad-hoc" | "development" | "enterprise"
OUTDIR="$(pwd)/dist-ios"
ARCHIVE_PATH="$OUTDIR/App.xcarchive"
IPA_PATH="$OUTDIR/App.ipa"
# ============================

echo "==> Comprobando rutas"
cd "$IOS_ROOT"
test -f "$WORKSPACE" || { echo "❌ No existe $WORKSPACE en $(pwd)"; exit 1; }
test -f "Podfile" || { echo "❌ No existe Podfile en $(pwd)"; exit 1; }
mkdir -p "$OUTDIR"

echo "==> Instalando CocoaPods"
pod repo update
pod install

# Asegura App.entitlements y push
ENT="App.entitlements"
if [[ ! -f "$ENT" ]]; then
  echo "==> Creando $ENT (vacío)"
  /usr/libexec/PlistBuddy -c "Save" "$ENT" 2>/dev/null || true
fi

echo "==> Asegurando clave de push (aps-environment) = development"
# Crea el dict si está vacío
/usr/libexec/PlistBuddy -c "Print" "$ENT" >/dev/null 2>&1 || /usr/libexec/PlistBuddy -c "Save" "$ENT"
# Si no existe, crea la clave
if ! /usr/libexec/PlistBuddy -c "Print :aps-environment" "$ENT" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Add :aps-environment string development" "$ENT"
fi

echo "==> Verificando workspace"
xcodebuild -list -workspace "$WORKSPACE" || { echo "❌ xcodebuild no pudo listar el workspace"; exit 1; }

echo "==> Limpiando build anterior"
rm -rf "$ARCHIVE_PATH" "$IPA_PATH"

echo "==> Archive (esto tarda):"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  CODE_SIGN_STYLE=Automatic \
  COMPILER_INDEX_STORE_ENABLE=NO \
  clean archive \
  -allowProvisioningUpdates

echo "==> Creando exportOptions.plist"
cat > "$OUTDIR/exportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>${EXPORT_METHOD}</string>
  <key>teamID</key><string>${TEAM_ID}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>compileBitcode</key><false/>
  <key>destination</key><string>export</string>
  <key>stripSwiftSymbols</key><true/>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
EOF

echo "==> Export IPA"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$OUTDIR" \
  -exportOptionsPlist "$OUTDIR/exportOptions.plist" \
  -allowProvisioningUpdates

# Mueve el .ipa a un nombre fijo si fuera necesario
found_ipa="$(ls "$OUTDIR"/*.ipa | head -n 1 || true)"
if [[ -f "$found_ipa" && "$found_ipa" != "$IPA_PATH" ]]; then
  mv "$found_ipa" "$IPA_PATH"
fi

echo "✅ Listo. IPA en: $IPA_PATH"
