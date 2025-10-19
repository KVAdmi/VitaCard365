-- VitaCard365 — Gym schema (safe to run multiple times)

-- 1) Essentials: circuits + items + RLS + policies
create extension if not exists "pgcrypto";

create table if not exists public.gym_circuits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  name text not null,
  notes text null,
  is_public boolean not null default false,
  tags jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_circuits_user_idx
  on public.gym_circuits (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_gym_circuits_updated on public.gym_circuits;
create trigger trg_gym_circuits_updated
before update on public.gym_circuits
for each row execute procedure public.set_updated_at();

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

create index if not exists gym_circuit_items_circuit_idx
  on public.gym_circuit_items (circuit_id, orden);

alter table public.gym_circuits enable row level security;
alter table public.gym_circuit_items enable row level security;

drop policy if exists gym_circuits_read on public.gym_circuits;
create policy gym_circuits_read on public.gym_circuits
  for select using (is_public = true or user_id = auth.uid());

drop policy if exists gym_circuits_insert on public.gym_circuits;
create policy gym_circuits_insert on public.gym_circuits
  for insert with check (user_id = auth.uid());

drop policy if exists gym_circuits_update on public.gym_circuits;
create policy gym_circuits_update on public.gym_circuits
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists gym_circuits_delete on public.gym_circuits;
create policy gym_circuits_delete on public.gym_circuits
  for delete using (user_id = auth.uid());

drop policy if exists gym_circuit_items_read on public.gym_circuit_items;
create policy gym_circuit_items_read on public.gym_circuit_items
  for select using (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

drop policy if exists gym_circuit_items_insert on public.gym_circuit_items;
create policy gym_circuit_items_insert on public.gym_circuit_items
  for insert with check (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists gym_circuit_items_update on public.gym_circuit_items;
create policy gym_circuit_items_update on public.gym_circuit_items
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

drop policy if exists gym_circuit_items_delete on public.gym_circuit_items;
create policy gym_circuit_items_delete on public.gym_circuit_items
  for delete using (
    exists (
      select 1 from public.gym_circuits c
      where c.id = gym_circuit_items.circuit_id
        and c.user_id = auth.uid()
    )
  );

-- 2) Optional: sessions + sets
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

create index if not exists gym_sessions_user_idx
  on public.gym_sessions (user_id, started_at desc);

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

create index if not exists gym_sets_session_idx
  on public.gym_sets (session_id, orden);

alter table public.gym_sessions enable row level security;
alter table public.gym_sets enable row level security;

drop policy if exists gym_sessions_read on public.gym_sessions;
create policy gym_sessions_read on public.gym_sessions
  for select using (user_id = auth.uid());

drop policy if exists gym_sessions_write on public.gym_sessions;
create policy gym_sessions_write on public.gym_sessions
  for insert with check (user_id = auth.uid());

drop policy if exists gym_sessions_update on public.gym_sessions;
create policy gym_sessions_update on public.gym_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists gym_sessions_delete on public.gym_sessions;
create policy gym_sessions_delete on public.gym_sessions
  for delete using (user_id = auth.uid());

drop policy if exists gym_sets_read on public.gym_sets;
create policy gym_sets_read on public.gym_sets
  for select using (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists gym_sets_write on public.gym_sets;
create policy gym_sets_write on public.gym_sets
  for insert with check (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists gym_sets_update on public.gym_sets;
create policy gym_sets_update on public.gym_sets
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

drop policy if exists gym_sets_delete on public.gym_sets;
create policy gym_sets_delete on public.gym_sets
  for delete using (
    exists (
      select 1 from public.gym_sessions s
      where s.id = gym_sets.session_id and s.user_id = auth.uid()
    )
  );

-- 3) Optional: user equipment
create table if not exists public.user_equipment (
  user_id uuid primary key,
  equipment text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_equipment enable row level security;

drop policy if exists user_equipment_read on public.user_equipment;
create policy user_equipment_read on public.user_equipment
  for select using (user_id = auth.uid());

drop policy if exists user_equipment_upsert on public.user_equipment;
create policy user_equipment_upsert on public.user_equipment
  for insert with check (user_id = auth.uid());

drop policy if exists user_equipment_update on public.user_equipment;
create policy user_equipment_update on public.user_equipment
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4) Example public template (safe to run multiple times; may create duplicates if re-run)
-- Insert a sample circuit named 'Full Body 3x' and attach three items.
-- Option A: Use explicit UUID casts
insert into public.gym_circuits (name, is_public, tags)
values ('Full Body 3x', true, '{"objetivo":"fuerza","nivel":"1"}'::jsonb);

with c as (
  select id from public.gym_circuits
  where name = 'Full Body 3x'
  order by created_at desc
  limit 1
)
insert into public.gym_circuit_items (circuit_id, orden, ejercicio_id, series, reps, descanso_seg)
select c.id::uuid, 1::int, '6d990b69-79ed-4f27-b0ad-b5b2c85e3091'::uuid, 3::int, 8::int, 90::int from c union all
select c.id::uuid, 2::int, 'e970cb2f-b6e6-4e5e-b4d8-a0ccbffbecc6'::uuid, 3::int, 8::int, 90::int from c union all
select c.id::uuid, 3::int, 'a2862510-a9bf-4b47-9c21-989d234937cc'::uuid, 3::int, 10::int, 75::int from c;

-- Option B: Look up ejercicio_id by slug (avoid hardcoded UUIDs)
-- (Run this instead of Option A if you prefer matching by slug.)
-- with c as (
--   select id from public.gym_circuits
--   where name = 'Full Body 3x'
--   order by created_at desc
--   limit 1
-- ),
-- e as (
--   select
--     (select id from public.ejercicios where slug = 'sentadilla-barra' limit 1) as sentadilla,
--     (select id from public.ejercicios where slug = 'press-banca' limit 1) as banca,
--     (select id from public.ejercicios where slug = 'remo-barra' limit 1) as remo
-- )
-- insert into public.gym_circuit_items (circuit_id, orden, ejercicio_id, series, reps, descanso_seg)
-- select c.id, 1, e.sentadilla, 3, 8, 90 from c, e union all
-- select c.id, 2, e.banca,     3, 8, 90 from c, e union all
-- select c.id, 3, e.remo,      3, 10, 75 from c, e;