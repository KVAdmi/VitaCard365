#!/usr/bin/env bash
set -euo pipefail

ENV="${ENV:-prod}"
CFG="appflow.config.json"
SAFE="appflow.safe.json"

echo "[ios-prebuild-safe] ENV=$ENV - sanitizing $CFG -> $SAFE"

jq --arg env "$ENV" '
  .environments |= (. // {}) |
  .environments.default |= (. // {}) |
  .environments.default.ios |= (. // {}) |
  .environments.default.ios.profiles |= (. // []) |
  .environments.default.ios.certificates |= (. // []) |
  .environments.default.ios.exportOptions |= (. // {}) |
  .environments.default.hooks |= (. // {}) |
  .environments.default.hooks.prebuild |= (. // []) |
  .environments.default.hooks.build |= (. // []) |
  .environments.default.hooks.postbuild |= (. // []) |
  .environments[$env] |= (. // .environments.default)
' "$CFG" > "$SAFE"

# Overwrite original so any legacy jq still reading CFG gets safe data
mv "$SAFE" "$CFG"
echo "[ios-prebuild-safe] Sanitization complete (in-place)."

# Basic null path audit (should be empty)
jq -r 'paths | select(getpath(.)==null) | map(tostring) | join(".")' "$CFG" || true
