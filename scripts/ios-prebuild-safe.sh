#!/usr/bin/env bash
set -euo pipefail

ENV="${ENV:-prod}"
CFG="${CFG:-appflow.config.json}"
SAFE="${SAFE:-appflow.safe.json}"

echo "[ios-prebuild-safe] ENV=$ENV - sanitizando $CFG -> $SAFE"

# Genera JSON saneado en SAFE
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
' "$CFG" > "$SAFE"

# Sobrescribe el original para legacy, pero mantenemos SAFE separado
cp "$SAFE" "$CFG"
echo "[ios-prebuild-safe] Listo: creado SAFE y sobreescrito original." 

# Auditoría de rutas null (informativa)
jq -r 'paths | select(getpath(.)==null) | map(tostring) | join(".")' "$SAFE" || true
