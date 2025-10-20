#!/usr/bin/env bash
# Script helper: instalar pods para ios/App
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../" && pwd)"
IOS_DIR="$ROOT_DIR/ios"
APP_DIR="$IOS_DIR/App"

echo "Instalando gems (si existe Gemfile)..."
if [ -f "$IOS_DIR/Gemfile" ]; then
  (cd "$IOS_DIR" && bundle install)
fi

echo "Instalando CocoaPods en ios/App..."
cd "$APP_DIR"
if command -v bundle >/dev/null 2>&1 && [ -f "$IOS_DIR/Gemfile" ]; then
  bundle exec pod install
else
  pod install
fi

echo "Pods instalados correctamente." 
