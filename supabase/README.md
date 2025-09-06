# Supabase – Migrations

## Flujo
- Cada cambio de DB va en `supabase/migrations/AAAAmmdd_HHMM_descripcion.sql`.
- **Nunca** cambiamos nombres de campos sin confirmación.
- Cambios manuales en consola deben convertirse a migration y commitearse.

## Aplicar en producción
- Copia el SQL al editor SQL de Supabase y ejecútalo.
- Luego sube el archivo al repo para versionarlo.
