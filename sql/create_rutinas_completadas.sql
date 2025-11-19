-- SQL Script to create the `rutinas_completadas` table in Supabase
CREATE TABLE IF NOT EXISTS rutinas_completadas (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    rutina_id UUID NOT NULL REFERENCES rutinas (id) ON DELETE CASCADE,
    fecha_completada TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, rutina_id, fecha_completada)
);

-- Index to optimize queries by user_id
CREATE INDEX IF NOT EXISTS idx_rutinas_completadas_user_id ON rutinas_completadas (user_id);

-- Index to optimize queries by rutina_id
CREATE INDEX IF NOT EXISTS idx_rutinas_completadas_rutina_id ON rutinas_completadas (rutina_id);