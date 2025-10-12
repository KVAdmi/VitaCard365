# Módulo Gym — Esquema Propuesto (Supabase)

Este esquema es 100% aditivo: no toca ni reemplaza las tablas actuales de rutinas/planes. Puedes ejecutarlo tal cual en el SQL Editor de Supabase. La Fase 1 te permite persistir circuitos; la Fase 2 agrega sesiones/series detalladas.

Importante: activa RLS y políticas para que cada usuario sólo vea/edite lo suyo; los circuitos públicos (plantillas) se exponen de forma de sólo lectura.

## Fase 1 — Persistir circuitos (mínimo viable)

```sql
-- Extensión para UUID si hace falta
create extension if not exists "pgcrypto" with schema public;

-- Tabla: gym_circuits
create table if not exists public.gym_circuits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null, -- null para plantillas públicas
  name text not null,
  notes text null,
  is_public boolean not null default false,
  tags jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Opcional: si quieres referenciar auth.users
-- alter table public.gym_circuits
--   add constraint gym_circuits_user_fk
--   foreign key (user_id) references auth.users (id) on delete set null;

create index if not exists gym_circuits_user_idx on public.gym_circuits (user_id, created_at desc);

-- Disparador para updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_gym_circuits_updated
before update on public.gym_circuits
for each row execute procedure public.set_updated_at();

-- Detalle del circuito
create table if not exists public.gym_circuit_items (
  id uuid primary key default gen_random_uuid(),
  circuit_id uuid not null references public.gym_circuits (id) on delete cascade,
  orden integer not null default 1,
  ejercicio_id uuid not null references public.ejercicios (id) on delete restrict,
  series integer not null default 3,
  reps integer null,
  tiempo_seg integer null,
  descanso_seg integer not null default 60
);

create index if not exists gym_circuit_items_circuit_idx on public.gym_circuit_items (circuit_id, orden);

-- RLS
alter table public.gym_circuits enable row level security;
alter table public.gym_circuit_items enable row level security;

-- Políticas: lectura
create policy if not exists gym_circuits_read on public.gym_circuits
  for select using (
    is_public = true or user_id = auth.uid()
  );

create policy if not exists gym_circuit_items_read on public.gym_circuit_items
  for select using (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

-- Políticas: insert
create policy if not exists gym_circuits_insert on public.gym_circuits
  for insert with check (
    -- permitir insertar propios (user_id=auth.uid());
    -- si quisieras permitir crear plantillas públicas desde un service role, hazlo por edge function
    user_id = auth.uid()
  );

create policy if not exists gym_circuit_items_insert on public.gym_circuit_items
  for insert with check (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and c.user_id = auth.uid()
    )
  );

-- Políticas: update
create policy if not exists gym_circuits_update on public.gym_circuits
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists gym_circuit_items_update on public.gym_circuit_items
  for update using (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and c.user_id = auth.uid()
    )
  );

-- Políticas: delete
create policy if not exists gym_circuits_delete on public.gym_circuits
  for delete using (user_id = auth.uid());

create policy if not exists gym_circuit_items_delete on public.gym_circuit_items
  for delete using (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and c.user_id = auth.uid()
    )
  );
```

Con esto podrás guardar y leer circuitos del usuario y exponer plantillas públicas (is_public=true, user_id null). Las plantillas públicas se insertan idealmente con una función/clave de servicio (edge function) o manualmente via SQL.

## Fase 2 — Registrar sesiones y series (progreso Gym)

Si quieres registrar entrenamientos detallados con series:

```sql
-- Sesiones (corridas del circuito o libres)
create table if not exists public.gym_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  circuit_id uuid null references public.gym_circuits (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  minutos integer null,
  kcal integer null,
  notes text null
);

create index if not exists gym_sessions_user_idx on public.gym_sessions (user_id, started_at desc);

-- Detalle de series
create table if not exists public.gym_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.gym_sessions (id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios (id) on delete restrict,
  orden integer not null default 1,
  serie integer not null default 1,
  reps integer null,
  tiempo_seg integer null,
  peso numeric(8,2) null,
  rpe numeric(4,2) null,
  created_at timestamptz not null default now()
);

create index if not exists gym_sets_session_idx on public.gym_sets (session_id, orden);

-- RLS
alter table public.gym_sessions enable row level security;
alter table public.gym_sets enable row level security;

-- Políticas
create policy if not exists gym_sessions_read on public.gym_sessions for select using (user_id = auth.uid());
create policy if not exists gym_sessions_write on public.gym_sessions for insert with check (user_id = auth.uid());
create policy if not exists gym_sessions_update on public.gym_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists gym_sessions_delete on public.gym_sessions for delete using (user_id = auth.uid());

create policy if not exists gym_sets_read on public.gym_sets
  for select using (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );

create policy if not exists gym_sets_write on public.gym_sets
  for insert with check (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );

create policy if not exists gym_sets_update on public.gym_sets
  for update using (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );

create policy if not exists gym_sets_delete on public.gym_sets
  for delete using (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );
```

Notas:
- Puedes seguir usando la tabla `workouts` para KPI agregados del Progreso general y dejar `gym_sessions/gym_sets` para el detalle de Gym. Si más adelante quieres unificar, creamos una view que los agrupe.

## Opcional — Preferencias de equipo del usuario

Esto ayuda a ajustar las sugerencias y filtros por el equipo disponible.

```sql
create table if not exists public.user_equipment (
  user_id uuid primary key,
  equipment text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_equipment enable row level security;
create policy if not exists user_equipment_read on public.user_equipment for select using (user_id = auth.uid());
create policy if not exists user_equipment_upsert on public.user_equipment for insert with check (user_id = auth.uid());
create policy if not exists user_equipment_update on public.user_equipment for update using (user_id = auth.uid()) with check (user_id = auth.uid());
```

## Cómo ejecutarlo

1) Abre Supabase > SQL Editor.
2) Copia y ejecuta el bloque de SQL de la Fase 1 (y la Fase 2 si quieres ya progreso detallado).
3) Verifica que se crearon tablas, índices y políticas.
4) (Opcional) Inserta algunas plantillas públicas en `gym_circuits` con `is_public=true` y `user_id=null`.

Ejemplo de plantilla pública:

```sql
insert into public.gym_circuits (name, is_public, tags)
values ('Full Body 3x', true, '{"objetivo":"fuerza","nivel":"1"}');

with c as (
  select id from public.gym_circuits where name='Full Body 3x' order by created_at desc limit 1
)
insert into public.gym_circuit_items (circuit_id, orden, ejercicio_id, series, reps, descanso_seg)
select c.id, 1, '6d990b69-79ed-4f27-b0ad-b5b2c85e3091', 3, 8, 90 from c union all -- sentadilla-barra
select c.id, 2, 'e970cb2f-b6e6-4e5e-b4d8-a0ccbffbecc6', 3, 8, 90 from c union all -- press-banca
select c.id, 3, 'a2862510-a9bf-4b47-9c21-989d234937cc', 3, 10, 75 from c;       -- remo-barra
```

Con esto, el catálogo/constructor/runner ya podrán cargar circuitos persistidos y plantillas públicas bajo RLS seguro.

## Integración en la app (cuando confirmes)

- Lectura: mostrar circuitos del usuario + públicos en `/fit/gym/circuit` como “Mis circuitos” y “Plantillas”.
- Guardado: botón “Guardar circuito” creará/actualizará `gym_circuits` y `gym_circuit_items` (solo si habilitamos persistencia; de momento seguimos con localStorage).
- Progreso: al terminar en Runner, opcionalmente crear una `gym_session` (y `gym_sets` si quieres granularidad), además de mantener la inserción en `workouts` para KPIs globales.

Todo esto es opcional y no rompe flujos actuales.
