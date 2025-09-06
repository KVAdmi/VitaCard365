-- Crea bucket 'meditaciones' si no existe y políticas de lectura pública
-- Seguro e idempotente

insert into storage.buckets (id, name, public)
select 'meditaciones', 'meditaciones', true
where not exists (
  select 1 from storage.buckets where id = 'meditaciones'
);

do $$
begin
  execute 'alter table storage.objects enable row level security';

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'read_public_meditaciones'
  ) then
    execute $pol$
      create policy "read_public_meditaciones"
      on storage.objects
      for select
      using ( bucket_id = 'meditaciones' );
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'insert_authenticated_meditaciones'
  ) then
    execute $pol$
      create policy "insert_authenticated_meditaciones"
      on storage.objects
      for insert
      to authenticated
      with check ( bucket_id = 'meditaciones' );
    $pol$;
  end if;
end$$;
