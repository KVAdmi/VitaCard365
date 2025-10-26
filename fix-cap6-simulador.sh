#!/usr/bin/env bash
set -euo pipefail

echo "== 0) Sanity: raíz del repo =="
test -f package.json || { echo "❌ No estás en la raíz (falta package.json)"; pwd; exit 1; }

echo "== 1) Asegurar plataforma iOS inicializada =="
[ -d ios ] || npx cap add ios

echo "== 2) Subir Deployment Target del proyecto a 14.0 (patch en .pbxproj) =="
PBX="ios/App/App.xcodeproj/project.pbxproj"
test -f "$PBX" || { echo "❌ Falta $PBX"; exit 1; }
sed -i.bak -E 's/(IPHONEOS_DEPLOYMENT_TARGET = )1[23]\.[0-9]+;/\114.0;/g' "$PBX"

echo "== 3) Asegurar bloque post_install en Podfile (parches + forzar 14.0 en Pods) =="
PODFILE="ios/App/Podfile"
grep -q "post_install do |installer|" "$PODFILE" || cat >> "$PODFILE" <<'RUBY'

post_install do |installer|
  bridge_paths = [
    "Pods/Development Pods/Capacitor/CapacitorBridge/CapacitorBridge.swift",
    "../../node_modules/@capacitor/ios/Capacitor/Capacitor/CapacitorBridge.swift"
  ]
  bridge_paths.each do |p|
    path = File.expand_path(p, __dir__)
    next unless File.exist?(path)
    s = File.read(path)
    s2 = s.gsub(/if\s*#available\s*\(\s*iOS\s*16\.4\s*,\s*\*\s*\)\s*\{\s*self\.webView\?\.\s*isInspectable\s*=\s*isWebDebuggable\s*\}/m,
                "/* patched for Xcode14: isInspectable not available */")
    File.write(path, s2) if s2 != s
  end

  enc_paths = [
    "Pods/Development Pods/Capacitor/Codable/JSValueEncoder.swift",
    "../../node_modules/@capacitor/ios/Capacitor/Codable/JSValueEncoder.swift"
  ]
  enc_paths.each do |p|
    path = File.expand_path(p, __dir__)
    next unless File.exist?(path)
    s = File.read(path)
    if s =~ /var\s+type:\s*String\s*\{[^}]*case\s*\.singleValue:\s*\"SingleValueContainer\"/m
      fixed = "var type: String {\n  switch self {\n  case .singleValue:\n    return \"SingleValueContainer\"\n  case .unkeyed:\n    return \"UnkeyedContainer\"\n  case .keyed:\n    return \"KeyedContainer\"\n  }\n}"
      s2 = s.sub(/var\s+type:\s*String\s*\{[^\}]*\}/m, fixed)
      File.write(path, s2) if s2 != s
    end
  end

  installer.pods_project.targets.each do |t|
    t.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
    end
  end
end
RUBY

echo "== 4) Reinstalar Pods =="
cd ios/App
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ../..

echo "== 5) Copiar assets web =="
npm run build
npx cap copy ios

echo "== 6) Limpiar DerivedData y compilar para simulador iOS 14+ =="
rm -rf ~/Library/Developer/Xcode/DerivedData/*
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 14' build
cd ../..

echo "✅ Listo: target 14.0 + pods 14.0 + assets copiados + build simulador OK"
