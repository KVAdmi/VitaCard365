-- Tabla para incidencias de test de alertas
CREATE TABLE IF NOT EXISTS incidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  test_id text NOT NULL,
  level text NOT NULL, -- 'A', 'B', 'C', 'D'
  created_at timestamptz DEFAULT now(),
  rationale jsonb,
  answers jsonb,
  advice text
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_incidencias_user_id ON incidencias(user_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_test_id ON incidencias(test_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_level ON incidencias(level);
