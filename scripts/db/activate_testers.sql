-- scripts/db/activate_testers.sql
-- Marca cuentas de testers como pagadas (no cambia folio ni tipo_vita)
-- Uso: revisar, ejecutar en entorno seguro (psql o Supabase SQL editor)

BEGIN;

-- 1) Ver consulta que afectará (backup previo)
SELECT user_id, email, plan_status, entitlements, codigo_vita, tipo_vita
FROM public.profiles
WHERE lower(email) IN (
  'escalerajavier81@gmail.com',
  'mojicamaru@gmail.com',
  'rivasximena586@gmail.com',
  'davidjm00064@gmail.com'
);

-- 2) UPDATE seguro: dejará plan_status='active', añadirá 'PAID' a entitlements si no existe
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

-- 3) Si todo está bien, COMMIT;
-- COMMIT;

-- 4) Rollback manual (si ejecutaste pero quieres revertir):
-- Puedes usar los datos del SELECT anterior para revertir individualmente.
-- Ejemplo de rollback parcial (ejecutar solo si sabes qué valores previos quieres restaurar):
-- UPDATE public.profiles SET plan_status = 'previous_value', entitlements = previous_entitlements_array WHERE email = '...';

-- NOTA: No ejecutes este archivo en producción sin revisar. Siempre hacer backup o ejecutar en staging primero.
