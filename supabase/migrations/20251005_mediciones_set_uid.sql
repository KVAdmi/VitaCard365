-- Asegura que public.mediciones registra al usuario autenticado automáticamente
-- Esto evita errores con la política RLS de INSERT si el cliente no envía usuario_id

create or replace function public.set_mediciones_usuario_id()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.usuario_id is null then
    new.usuario_id := auth.uid();
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_set_mediciones_usuario_id'
  ) then
    create trigger trg_set_mediciones_usuario_id
    before insert on public.mediciones
    for each row
    execute function public.set_mediciones_usuario_id();
  end if;
end $$;

-- Índices recomendados para performance por usuario y fecha (si existe columna fecha)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'mediciones' and column_name = 'usuario_id'
  ) and not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='mediciones' and indexname='idx_mediciones_usuario_id'
  ) then
    create index idx_mediciones_usuario_id on public.mediciones (usuario_id);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'mediciones' and column_name = 'fecha'
  ) and not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='mediciones' and indexname='idx_mediciones_usuario_fecha'
  ) then
    create index idx_mediciones_usuario_fecha on public.mediciones (usuario_id, fecha);
  end if;
end $$;
