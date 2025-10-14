#!/usr/bin/env bash
# Hotfix: normaliza appflow.config.json IN-PLACE antes de cualquier otro uso de jq.
# Uso sugerido en CI (antes de build-ios):
#   bash scripts/ios-hotfix-inplace.sh
# Idempotente y seguro.
set -euo pipefail

export ENV="${ENV:-prod}"
CFG="appflow.config.json"
TMP="appflow.fixed.json"

jq --arg env "$ENV" '
  .environments |= (. // {}) |
  .environments.default |= (. // {}) |
  .environments.default.ios |= (. // {}) |
  .environments.default.ios.exportOptions |= (. // {}) |
  .environments.default.ios.profiles |= (. // []) |
  .environments.default.ios.certificates |= (. // []) |
  .environments.default.hooks |= (. // {}) |
  .environments.default.hooks.prebuild |= (. // []) |
  .environments.default.hooks.postbuild |= (. // []) |
  .environments[$env] |= (. // .environments.default) |
  .environments[$env].ios |= (. // {}) |
  .environments[$env].ios.exportOptions |= (. // {}) |
  .environments[$env].ios.profiles |= (. // []) |
  .environments[$env].ios.certificates |= (. // []) |
  .environments[$env].hooks |= (. // {}) |
  .environments[$env].hooks.prebuild |= (. // []) |
  .environments[$env].hooks.postbuild |= (. // [])
' "$CFG" > "$TMP" && mv "$TMP" "$CFG"

echo "[ios-hotfix-inplace] Normalización completa (ENV=$ENV)."

# Debug opcional de rutas null
jq -r 'paths | select(getpath(.)==null) | join(".")' "$CFG" || true
