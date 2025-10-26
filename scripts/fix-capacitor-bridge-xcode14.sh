#!/usr/bin/env bash
# fix-capacitor-bridge-xcode14.sh
# Parchea isInspectable en CapacitorBridge.swift para Xcode 14 (Capacitor 6.x contaminado)

set -e

# Rutas posibles
NODE_MODULES_SWIFT="node_modules/@capacitor/ios/Capacitor/Capacitor/CapacitorBridge.swift"
PODS_SWIFT="Pods/Development Pods/Capacitor/CapacitorBridge/CapacitorBridge.swift"

for SWIFT in "$NODE_MODULES_SWIFT" "$PODS_SWIFT"; do
  if [ -f "$SWIFT" ]; then
    echo "Patching $SWIFT ..."
    # Solo si la línea existe
    grep -q 'isInspectable' "$SWIFT" && \
      sed -i.bak 's/self\.webView\?\.isInspectable = isWebDebuggable\s*/\/\* patched for Xcode14: isInspectable not available *\//g' "$SWIFT"
    # Limpia backups
    rm -f "$SWIFT.bak"
  fi
done
