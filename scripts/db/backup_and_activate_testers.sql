-- scripts/db/backup_and_activate_testers.sql
-- 1) Crea tabla de backup (si no existe), 2) inserta snapshot de las filas a afectar,
-- 3) realiza el UPDATE para marcar testers como pagados y devuelve filas modificadas.
-- Ejecutar en un entorno seguro (psql o Supabase SQL editor). No ejecutar sin revisar.

BEGIN;

-- Crear tabla de backups si no existe
CREATE TABLE IF NOT EXISTS public.profiles_backups (
  id serial PRIMARY KEY,
  snapshot_time timestamptz DEFAULT now(),
  user_id bigint,
  email text,
  plan_status text,
  entitlements text[],
  codigo_vita text,
  tipo_vita text
);

-- Lista de emails objetivo
WITH target_emails(email) AS (
  VALUES
    ('escalerajavier81@gmail.com'),
    ('mojicamaru@gmail.com'),
    ('rivasximena586@gmail.com'),
    ('davidjm00064@gmail.com')
)

-- 1) Inserta snapshot de las filas actuales en la tabla de backups
INSERT INTO public.profiles_backups (user_id, email, plan_status, entitlements, codigo_vita, tipo_vita)
SELECT p.user_id, p.email, p.plan_status, p.entitlements, p.codigo_vita, p.tipo_vita
FROM public.profiles p
WHERE lower(p.email) IN (SELECT lower(email) FROM target_emails);

-- 2) Ejecutar update seguro (igual que en activate_testers.sql)
WITH target_emails(email) AS (
  VALUES
    ('escalerajavier81@gmail.com'),
    ('mojicamaru@gmail.com'),
    ('rivasximena586@gmail.com'),
    ('davidjm00064@gmail.com')
),

upd AS (
  UPDATE public.profiles p
  SET
    plan_status = 'active',
    entitlements = CASE
      WHEN p.entitlements IS NULL
        THEN ARRAY['PAID']::text[]
      WHEN NOT ('PAID' = ANY(p.entitlements))
        THEN array_append(p.entitlements, 'PAID')
      ELSE p.entitlements
    END,
    origen = COALESCE(p.origen, 'cortesia')
  WHERE lower(p.email) IN (SELECT lower(email) FROM target_emails)
  RETURNING p.user_id, p.email, p.plan_status, p.entitlements, p.codigo_vita, p.tipo_vita
)

SELECT * FROM upd ORDER BY email;

-- 3) Si todo está bien, ejecutar COMMIT; de lo contrario, ROLLBACK;
-- COMMIT;
-- ROLLBACK;

-- 4) Instrucciones para revertir usando la última snapshot guardada (ejecutar manualmente si es necesario):
-- Reemplaza los emails por los que quieras revertir.
-- WITH latest AS (
--   SELECT DISTINCT ON (lower(email)) email, user_id, plan_status, entitlements
--   FROM public.profiles_backups
--   WHERE lower(email) IN (
--     'escalerajavier81@gmail.com', 'mojicamaru@gmail.com', 'rivasximena586@gmail.com', 'davidjm00064@gmail.com'
--   )
--   ORDER BY lower(email), snapshot_time DESC
-- )
-- UPDATE public.profiles p
-- SET plan_status = l.plan_status,
--     entitlements = l.entitlements
-- FROM latest l
-- WHERE lower(p.email) = lower(l.email)
-- RETURNING p.user_id, p.email, p.plan_status, p.entitlements;

-- NOTA: La tabla public.profiles_backups conserva los snapshots; puedes exportarla o consultarla
-- para restaurar cualquier dato previo si es necesario.
