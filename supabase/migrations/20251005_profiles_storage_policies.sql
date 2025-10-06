-- Habilitar RLS y crear políticas con guards DO $$ para evitar 42601

-- Asegurar RLS en profiles
alter table if exists public.profiles enable row level security;

-- Insert (crear su propia fila)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles insert self'
  ) then
    create policy "profiles insert self" on public.profiles
      for insert to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

-- Update (sólo su propia fila)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles update self'
  ) then
    create policy "profiles update self" on public.profiles
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

-- Storage: bucket avatars (crear si no existe)
do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'avatars'
  ) then
    insert into storage.buckets (id, name, public) values ('avatars','avatars', false);
  end if;
end $$;

-- Políticas para objetos del bucket avatars
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars insert own path'
  ) then
    create policy "avatars insert own path" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars update own path'
  ) then
    create policy "avatars update own path" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars select own or public'
  ) then
    create policy "avatars select own or public" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'avatars' and (
          split_part(name, '/', 1) = auth.uid()::text
          or (metadata ? 'public' and (metadata->>'public')::boolean = true)
        )
      );
  end if;
end $$;
