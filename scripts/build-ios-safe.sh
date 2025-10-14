#!/usr/bin/env bash
set -euo pipefail

CFG="appflow.config.json"
ENV="${ENV:-prod}"

# Define scope with environment fallback
SCOPE_FILTER='(.environments[$env] // .environments.default // {})'

# Helper to run jq safely with environment
jq_env() {
  jq -r --arg env "$ENV" "$1" "$CFG"
}

echo "[build-ios-safe] Using ENV=$ENV"

# Example: list profile names (will output nothing if none, without crashing)
PROFILES=$(jq_env "$SCOPE_FILTER | (.ios.profiles // [])[] | .name // empty") || true
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
  done < <(jq -r "(.hooks.$phase // [])[]" "$CFG")

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
  done < <(jq -r ".build.ios.scripts.$phase[]" "$CFG" 2>/dev/null || echo "")

done

echo "[build-ios-safe] Completed script phase execution. Hand off to Xcode build next."
