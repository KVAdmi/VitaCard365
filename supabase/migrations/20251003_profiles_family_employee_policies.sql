-- Políticas para garantizar que sólo el propietario actualice su avatar_url

alter table if exists public.profiles
  add column if not exists avatar_url text;

create policy if not exists "profiles select self" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy if not exists "profiles update self" on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- family_members y enterprise_employees pudieron haberse creado ya con RLS; añadimos políticas de update seguras
create policy if not exists "family_members update self" on public.family_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "family_members select self" on public.family_members
  for select to authenticated
  using (user_id = auth.uid());

create policy if not exists "enterprise_employees update self" on public.enterprise_employees
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "enterprise_employees select self" on public.enterprise_employees
  for select to authenticated
  using (user_id = auth.uid());
