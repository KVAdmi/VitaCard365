#!/usr/bin/env bash
set -euo pipefail

if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "pod-install.sh: macOS requerido. Saltando."
  exit 0
fi

cd "$(dirname "$0")/../../ios" || exit 1

if command -v bundle >/dev/null 2>&1 && [[ -f "Gemfile" || -f "Gemfile.lock" ]]; then
  echo "Instalando gems con Bundler..."
  bundle install
  BUNDLE="bundle exec"
else
  echo "Bundler no disponible. Intentando cocoapods global..."
  BUNDLE=""
fi

cd App
if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods no instalado. Saltando pod install."
  exit 0
fi

echo "Actualizando repos de pods..."
$BUNDLE pod repo update

echo "Instalando pods..."
$BUNDLE pod install

echo "Pods instalados correctamente."
