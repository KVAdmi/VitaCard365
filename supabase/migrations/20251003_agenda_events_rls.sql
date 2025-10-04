-- RLS y triggers para agenda_events

-- Asegurar RLS
alter table if exists public.agenda_events enable row level security;

-- Select propio
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='agenda_events' and policyname='agenda_events select self'
  ) then
    create policy "agenda_events select self" on public.agenda_events
      for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Insert propio (sólo puede insertar para sí mismo)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='agenda_events' and policyname='agenda_events insert self'
  ) then
    create policy "agenda_events insert self" on public.agenda_events
      for insert to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

-- Update propio

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='agenda_events' and policyname='agenda_events update self'
  ) then
    create policy "agenda_events update self" on public.agenda_events
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

-- Delete propio

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='agenda_events' and policyname='agenda_events delete self'
  ) then
    create policy "agenda_events delete self" on public.agenda_events
      for delete to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Trigger de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

-- Crear trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_agenda_events_updated_at'
  ) THEN
    CREATE TRIGGER trg_agenda_events_updated_at
    BEFORE UPDATE ON public.agenda_events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Índices útiles
create index if not exists idx_agenda_events_user_date_time on public.agenda_events (user_id, event_date, event_time);
create index if not exists idx_agenda_events_repeat on public.agenda_events (user_id, repeat_type);
