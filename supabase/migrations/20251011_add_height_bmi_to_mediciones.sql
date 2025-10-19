-- Migration: add height_cm and bmi to mediciones with trigger to auto-fill and compute BMI

-- 1) Add columns if not exists
alter table if exists public.mediciones
  add column if not exists height_cm numeric(5,2),
  add column if not exists bmi numeric(5,2);

-- 2) Constraints for ranges
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_med_height_cm_range'
  ) then
    alter table public.mediciones
      add constraint chk_med_height_cm_range
      check (
        height_cm is null or (height_cm >= 90::numeric and height_cm <= 250::numeric)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_med_bmi_range'
  ) then
    alter table public.mediciones
      add constraint chk_med_bmi_range
      check (
        bmi is null or (bmi >= 10::numeric and bmi <= 80::numeric)
      );
  end if;
end
$$ language plpgsql;

-- 3) Function to fill height and compute BMI
create or replace function public.mediciones_fill_bmi()
returns trigger
language plpgsql
as $$
declare
  v_last_height numeric;
begin
  -- If no weight provided, nothing to compute
  if new.peso_kg is null then
    return new;
  end if;

  -- Try to adopt last known height for the same user if missing
  if new.height_cm is null then
    select m.height_cm into v_last_height
    from public.mediciones m
    where m.usuario_id = coalesce(new.usuario_id, auth.uid())
      and m.height_cm is not null
    order by m.ts desc
    limit 1;

    if v_last_height is not null then
      new.height_cm := v_last_height;
    end if;
  end if;

  -- Compute BMI if we have height
  if new.height_cm is not null and new.height_cm > 0 then
    new.bmi := round((new.peso_kg / ((new.height_cm/100.0) * (new.height_cm/100.0)))::numeric, 1);
  end if;

  return new;
end;
$$;

-- 4) Trigger to apply on insert/update
drop trigger if exists trg_mediciones_fill_bmi on public.mediciones;
create trigger trg_mediciones_fill_bmi
before insert or update of peso_kg, height_cm on public.mediciones
for each row execute function public.mediciones_fill_bmi();

-- 5) Backfill height from last known per user
with last_heights as (
  select m.usuario_id,
         (array_remove(array_agg(m.height_cm order by m.ts desc), null))[1] as lh
  from public.mediciones m
  group by m.usuario_id
)
update public.mediciones m
set height_cm = lh.lh
from last_heights lh
where m.usuario_id = lh.usuario_id
  and m.height_cm is null
  and lh.lh is not null;

-- 6) Backfill BMI where possible
update public.mediciones m
set bmi = round((m.peso_kg / ((m.height_cm/100.0)*(m.height_cm/100.0)))::numeric, 1)
where m.peso_kg is not null
  and m.height_cm is not null
  and m.bmi is null;

-- 7) Useful indexes (idempotent)
create index if not exists idx_mediciones_usuario_ts on public.mediciones (usuario_id, ts desc);
