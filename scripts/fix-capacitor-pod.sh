#!/bin/bash
set -e
TARGET_FILE="ios/App/Pods/Capacitor/ios/Capacitor/CapacitorBridge.swift"
if [ -f "$TARGET_FILE" ]; then
  # Comenta la línea con isInspectable si existe y no está comentada
  sed -i '' 's/^[[:space:]]*\(self\.webView\?\.isInspectable = isWebDebuggable\)/\/\/ \1/' "$TARGET_FILE"
fi
