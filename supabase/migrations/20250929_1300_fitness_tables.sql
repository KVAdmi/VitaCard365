-- Migración: Tablas de Fitness
-- Fecha: 2025-09-29
-- Objetivo: Crear las tablas necesarias para el módulo de fitness

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de planes de entrenamiento
CREATE TABLE IF NOT EXISTS planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  objetivo text NOT NULL,
  nivel text DEFAULT 'principiante',
  dias_semana integer DEFAULT 3,
  minutos_sesion integer DEFAULT 25,
  estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'completado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de rutinas diarias
CREATE TABLE IF NOT EXISTS rutinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES planes(id) ON DELETE CASCADE,
  semana integer NOT NULL,
  dia integer NOT NULL CHECK (dia >= 1 AND dia <= 7),
  foco text NOT NULL,
  minutos integer NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'saltada')),
  completada_en timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, semana, dia)
);

-- Tabla de ejercicios asignados a rutinas
CREATE TABLE IF NOT EXISTS rutina_ejercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rutina_id uuid REFERENCES rutinas(id) ON DELETE CASCADE,
  ejercicio_id uuid REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden integer NOT NULL,
  series integer NOT NULL DEFAULT 3,
  reps integer,
  tiempo_seg integer,
  descanso_seg integer DEFAULT 60,
  rpe integer DEFAULT 7 CHECK (rpe >= 1 AND rpe <= 10),
  notas text,
  created_at timestamptz DEFAULT now()
);

-- Tabla de rutinas diarias (tracking)
CREATE TABLE IF NOT EXISTS rutina_diaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rutina_id uuid REFERENCES rutinas(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  completada boolean DEFAULT false,
  tiempo_total_min integer,
  notas text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, fecha)
);

-- Vista para mostrar el detalle completo de rutinas
CREATE OR REPLACE VIEW v_rutina_detalle AS
SELECT 
  r.id as rutina_id,
  r.user_id,
  r.semana,
  r.dia as dia_semana,
  r.foco,
  r.minutos,
  re.id as rutina_ejercicio_id,
  e.slug,
  e.nombre,
  e.categoria,
  e.equipo,
  e.cues,
  e.contraindicaciones,
  e.imagen_url,
  re.series,
  re.reps,
  re.tiempo_seg,
  re.descanso_seg,
  re.rpe
FROM rutinas r
JOIN rutina_ejercicios re ON r.id = re.rutina_id
JOIN ejercicios e ON re.ejercicio_id = e.id
ORDER BY r.user_id, r.semana, r.dia, re.orden;

-- Habilitar RLS (Row Level Security)
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutina_ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutina_diaria ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para planes
CREATE POLICY "Users can view own plans" ON planes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plans" ON planes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plans" ON planes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own plans" ON planes
  FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para rutinas
CREATE POLICY "Users can view own routines" ON rutinas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own routines" ON rutinas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own routines" ON rutinas
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own routines" ON rutinas
  FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para rutina_ejercicios
CREATE POLICY "Users can view own routine exercises" ON rutina_ejercicios
  FOR SELECT USING (
    rutina_id IN (SELECT id FROM rutinas WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own routine exercises" ON rutina_ejercicios
  FOR INSERT WITH CHECK (
    rutina_id IN (SELECT id FROM rutinas WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own routine exercises" ON rutina_ejercicios
  FOR UPDATE USING (
    rutina_id IN (SELECT id FROM rutinas WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own routine exercises" ON rutina_ejercicios
  FOR DELETE USING (
    rutina_id IN (SELECT id FROM rutinas WHERE user_id = auth.uid())
  );

-- Políticas RLS para rutina_diaria
CREATE POLICY "Users can view own daily routines" ON rutina_diaria
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily routines" ON rutina_diaria
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily routines" ON rutina_diaria
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own daily routines" ON rutina_diaria
  FOR DELETE USING (user_id = auth.uid());

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_planes_user_id_estado ON planes(user_id, estado);
CREATE INDEX IF NOT EXISTS idx_rutinas_user_id_semana_dia ON rutinas(user_id, semana, dia);
CREATE INDEX IF NOT EXISTS idx_rutina_ejercicios_rutina_id_orden ON rutina_ejercicios(rutina_id, orden);
CREATE INDEX IF NOT EXISTS idx_rutina_diaria_user_id_fecha ON rutina_diaria(user_id, fecha);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en planes
CREATE TRIGGER update_planes_updated_at 
  BEFORE UPDATE ON planes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE planes IS 'Planes de entrenamiento de los usuarios';
COMMENT ON TABLE rutinas IS 'Rutinas diarias específicas por semana y día';
COMMENT ON TABLE rutina_ejercicios IS 'Ejercicios asignados a cada rutina con sus parámetros';
COMMENT ON TABLE rutina_diaria IS 'Tracking de rutinas completadas por día';
COMMENT ON VIEW v_rutina_detalle IS 'Vista completa de rutinas con detalles de ejercicios';
