#!/usr/bin/env bash
set -euo pipefail

CFG="${CFG:-appflow.config.json}"
SAFE="${SAFE:-appflow.safe.json}"
ENV="${ENV:-prod}"

echo "[build-ios-safe] ENV=$ENV - preparando lectura segura desde $SAFE (fallback $CFG)"

# Garantiza que si SAFE no existe aún, se genera vía ios-prebuild-safe
if [ ! -f "$SAFE" ]; then
  echo "[build-ios-safe] SAFE no existe; invocando ios-prebuild-safe.sh"
  bash scripts/ios-prebuild-safe.sh
fi

# Filtro de alcance
SCOPE_FILTER='(.environments[$env] // .environments.default // {})'

# Helper to run jq safely against SAFE
jq_env() {
  jq -r --arg env "$ENV" "$1" "$SAFE"
}

echo "[build-ios-safe] Null path audit (should be empty or benign):"
jq -r 'paths | select(getpath(.)==null) | map(tostring) | join(".")' "$SAFE" || true

# Example: list profile names (will output nothing if none)
PROFILES=$(jq_env "$SCOPE_FILTER | (.ios.profiles // [])[] | (.name // .id // empty)") || true
if [ -n "$PROFILES" ]; then
  echo "Profiles:"; printf '%s\n' "$PROFILES"
else
  echo "No iOS profiles defined"
fi

# Certificates (example extraction of IDs)
CERT_IDS=$(jq_env "$SCOPE_FILTER | (.ios.certificates // [])[] | (.id // .ID // empty)") || true
if [ -n "$CERT_IDS" ]; then
  echo "Certificate IDs:"; printf '%s\n' "$CERT_IDS"
else
  echo "No iOS certificates defined"
fi

# Hooks lifecycle (iterate safely)
for phase in prebuild build postbuild; do
  echo "Running global $phase hooks (if any)"
  while IFS= read -r hook; do
    [ -z "$hook" ] && continue
    echo "> $hook"
    bash -lc "$hook"
  done < <(jq -r "(.hooks.$phase // [])[]" "$SAFE")

  echo "Running env $phase hooks (if any)"
  while IFS= read -r hook; do
    [ -z "$hook" ] && continue
    echo "> $hook"
    bash -lc "$hook"
  done < <(jq_env "$SCOPE_FILTER | (.ios.hooks.$phase // [])[]")

done

# Execute scripts phases for iOS build section
for phase in prebuild build postbuild; do
  echo "Executing iOS build.$phase scripts"
  while IFS= read -r cmd; do
    [ -z "$cmd" ] && continue
    echo "> $cmd"
    bash -lc "$cmd"
  done < <(jq -r ".build.ios.scripts.$phase // [] | .[]" "$SAFE" 2>/dev/null || echo "")
done

echo "[build-ios-safe] Completed script phase execution. Hand off to Xcode build next."
