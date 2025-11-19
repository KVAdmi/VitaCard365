-- Policies sugeridas (verificarlas antes de habilitar RLS).
-- NO ejecutar si ya existen; revisar con:
-- select * from pg_policies where schemaname='public' and tablename IN ('planes','rutinas','rutina_ejercicios','workouts','profiles');

-- Ejemplo para workouts:
-- alter table public.workouts enable row level security;
-- create policy "Users can select their own workouts" on public.workouts for select using (user_id = auth.uid());
-- create policy "Users can insert their own workouts" on public.workouts for insert with check (user_id = auth.uid());
-- create policy "Users can update their own workouts" on public.workouts for update using (user_id = auth.uid());
-- create policy "Users can delete their own workouts" on public.workouts for delete using (user_id = auth.uid());

-- Ejemplo para profiles:
-- alter table public.profiles enable row level security;
-- create policy "Users can select their own profile" on public.profiles for select using (user_id = auth.uid());
-- create policy "Users can insert their own profile" on public.profiles for insert with check (user_id = auth.uid());
-- create policy "Users can update their own profile" on public.profiles for update using (user_id = auth.uid());
-- create policy "Users can delete their own profile" on public.profiles for delete using (user_id = auth.uid());

-- Ejemplo para planes:
-- alter table public.planes enable row level security;
-- create policy "select_own_planes" on public.planes for select using (user_id = auth.uid());
-- create policy "insert_own_planes" on public.planes for insert with check (user_id = auth.uid());
-- create policy "update_own_planes" on public.planes for update using (user_id = auth.uid());

-- Ejemplo para rutinas:
-- alter table public.rutinas enable row level security;
-- create policy "select_own_rutinas" on public.rutinas for select using (user_id = auth.uid());
-- create policy "insert_own_rutinas" on public.rutinas for insert with check (user_id = auth.uid());
-- create policy "update_own_rutinas" on public.rutinas for update using (user_id = auth.uid());

-- Ejemplo para rutina_ejercicios:
-- alter table public.rutina_ejercicios enable row level security;
-- create policy "select_own_rutina_ejercicios" on public.rutina_ejercicios for select using (user_id = auth.uid());
-- create policy "insert_own_rutina_ejercicios" on public.rutina_ejercicios for insert with check (user_id = auth.uid());
-- create policy "update_own_rutina_ejercicios" on public.rutina_ejercicios for update using (user_id = auth.uid());
