-- RLS y trigger para agenda_events

alter table if exists public.agenda_events enable row level security;

-- Trigger updated_at
create or replace function public.tg_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'agenda_events_set_updated_at'
  ) then
    create trigger agenda_events_set_updated_at
    before update on public.agenda_events
    for each row execute function public.tg_set_updated_at();
  end if;
end $$;

-- Policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda select own'
  ) then
    create policy "agenda select own" on public.agenda_events
      for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda insert own'
  ) then
    create policy "agenda insert own" on public.agenda_events
      for insert to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda update own'
  ) then
    create policy "agenda update own" on public.agenda_events
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda delete own'
  ) then
    create policy "agenda delete own" on public.agenda_events
      for delete to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Índices recomendados para consultas por usuario y ventana de tiempo
create index if not exists idx_agenda_user_date_time on public.agenda_events(user_id, event_date, event_time);
