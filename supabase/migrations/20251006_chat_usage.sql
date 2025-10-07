-- Tabla y funciones para limitar i-Vita a N chats por día por usuario
create table if not exists public.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint chat_usage_pkey primary key (user_id, day)
);

alter table public.chat_usage enable row level security;

-- Políticas: el usuario autenticado puede leer su propio conteo diario
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'chat_usage' and policyname = 'chat_usage_select_own'
  ) then
    create policy chat_usage_select_own on public.chat_usage
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- No permitimos insert/update directos: se hará por función SECURITY DEFINER

-- Función: incrementa conteo si no excede el límite
create or replace function public.increment_chat_usage(lim integer default 10)
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_day date := (now() at time zone 'America/Mexico_City')::date; -- ajustar a MX para corte diario
  v_count integer;
begin
  if v_user is null then
    return query select false as allowed, 0 as remaining;
    return;
  end if;

  -- Obtener el valor actual de la columna "count" para este usuario y día (no el número de filas)
  select c.count into v_count
  from public.chat_usage c
  where c.user_id = v_user and c.day = v_day;

  if v_count is null then
    if lim <= 0 then
      return query select false as allowed, 0 as remaining;
    end if;
    insert into public.chat_usage(user_id, day, count)
    values (v_user, v_day, 1)
    on conflict (user_id, day) do update set count = public.chat_usage.count + 1, updated_at = now();
    return query select true as allowed, greatest(lim - 1, 0) as remaining;
  else
    if v_count >= lim then
      return query select false as allowed, 0 as remaining;
    else
      update public.chat_usage
        set count = v_count + 1, updated_at = now()
        where user_id = v_user and day = v_day;
      return query select true as allowed, greatest(lim - (v_count + 1), 0) as remaining;
    end if;
  end if;
end $$;

revoke all on function public.increment_chat_usage(integer) from public;
grant execute on function public.increment_chat_usage(integer) to authenticated;
