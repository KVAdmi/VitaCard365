#!/usr/bin/env bash
# Guardia opcional para asegurar patrones null-safe en scripts relacionados a appflow.
# Ejecutar tras el hotfix y antes del build principal.
set -euo pipefail

FAIL=0

echo "[ci-guard-appflow] Verificando iteraciones de arrays sin // [] ..."
if grep -R --line-number --extended-regexp '\.[A-Za-z0-9_]+\[\]' scripts build-ios 2>/dev/null | grep -vE '\/\/ \[\]\)\[\]' ; then
  echo "[ci-guard-appflow][WARN] Se encontraron patrones .X[] potencialmente inseguros."
  FAIL=1
else
  echo "[ci-guard-appflow] OK: no hay iteraciones inseguras directas .X[]"
fi

echo "[ci-guard-appflow] Verificando usos directos de appflow.config.json (excepto hotfix) ..."
if rg -n "appflow.config.json" scripts 2>/dev/null | rg -v "ios-hotfix-inplace|ios-prebuild-safe|SAFE" ; then
  echo "[ci-guard-appflow][WARN] Hay scripts leyendo appflow.config.json directamente."
  FAIL=1
else
  echo "[ci-guard-appflow] OK: no hay lecturas crudas no permitidas."
fi

if [ $FAIL -eq 1 ]; then
  echo "[ci-guard-appflow] Resultado: HALLAZGOS detectados (puede continuar si se acepta el riesgo)." >&2
  exit 0  # No fallamos duro por ahora; cambia a exit 1 para bloquear.
else
  echo "[ci-guard-appflow] Resultado: limpio."
fi
