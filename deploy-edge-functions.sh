#!/bin/bash

# Script para desplegar las funciones Edge de Supabase
# Asegúrate de tener Supabase CLI instalado y configurado

echo "🚀 Desplegando funciones Edge de Supabase..."

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado. Instálalo desde: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/functions/generate-plan/index.ts" ]; then
    echo "❌ No se encontró la función generate-plan. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Desplegar función generate-plan
echo "📦 Desplegando función generate-plan..."
supabase functions deploy generate-plan

if [ $? -eq 0 ]; then
    echo "✅ Función generate-plan desplegada exitosamente"
else
    echo "❌ Error al desplegar generate-plan"
    exit 1
fi

# Desplegar función regenerate-day
echo "📦 Desplegando función regenerate-day..."
supabase functions deploy regenerate-day

if [ $? -eq 0 ]; then
    echo "✅ Función regenerate-day desplegada exitosamente"
else
    echo "❌ Error al desplegar regenerate-day"
    exit 1
fi

echo "🎉 Todas las funciones Edge han sido desplegadas exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecuta la migración de base de datos: supabase db push"
echo "2. Verifica que las funciones estén funcionando en el dashboard de Supabase"
echo "3. Prueba la aplicación para confirmar que las rutinas se generan correctamente"
