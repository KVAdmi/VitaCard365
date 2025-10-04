-- Bucket avatars: privado, con RLS a nivel de objeto
-- 1) Crear bucket si no existe (opcional en entornos nuevos)
insert into storage.buckets (id, name, public)
select 'avatars','avatars', false
where not exists (select 1 from storage.buckets where id='avatars');

-- 2) Políticas de objetos: sólo dueño puede operar
-- Reglas: la clave debe comenzar con auth.uid()::text || '/'

create policy if not exists "Avatars read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars' and (position((auth.uid())::text || '/' in name) = 1)
  );

create policy if not exists "Avatars insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars' and (position((auth.uid())::text || '/' in name) = 1)
  );

create policy if not exists "Avatars update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars' and (position((auth.uid())::text || '/' in name) = 1)
  ) with check (
    bucket_id = 'avatars' and (position((auth.uid())::text || '/' in name) = 1)
  );

create policy if not exists "Avatars delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars' and (position((auth.uid())::text || '/' in name) = 1)
  );

-- 3) Endpoints firmados: la app usará Signed URLs (no públicos)
-- Nota: si deseas miniaturas públicas, crea un Edge Function para servirlas con caché/CDN.
