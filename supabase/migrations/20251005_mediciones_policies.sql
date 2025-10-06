-- Habilitar RLS y permitir que cada usuario inserte/lea/actualice sus propias mediciones
alter table if exists public.mediciones enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mediciones' and policyname='mediciones insert self'
  ) then
    create policy "mediciones insert self" on public.mediciones
      for insert to authenticated
      with check (usuario_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mediciones' and policyname='mediciones select self'
  ) then
    create policy "mediciones select self" on public.mediciones
      for select to authenticated
      using (usuario_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mediciones' and policyname='mediciones update self'
  ) then
    create policy "mediciones update self" on public.mediciones
      for update to authenticated
      using (usuario_id = auth.uid())
      with check (usuario_id = auth.uid());
  end if;
end $$;
