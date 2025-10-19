-- Recreate a safe trigger to insert a minimal profile on new auth user
-- Scope: only identifiers/DB objects; do not change app logic.

-- Function: insert minimal profile, never block signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_email text;
  v_plan text;
  v_origin text;
begin
  -- Derive values from raw_user_meta_data (portable across Supabase versions)
  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'name',''),
    nullif(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'given_name',''),
    nullif(split_part(coalesce(new.email,''),'@',1), ''),
    concat('Usuario ', left(new.id::text, 8))
  );

  -- Ensure NOT NULL for profiles.email; use synthetic placeholder if missing
  v_email := coalesce(new.email, concat(new.id::text, '@noemail.local'));

  v_plan := coalesce(
    nullif(new.raw_user_meta_data->>'plan_status',''),
    nullif(new.raw_user_meta_data->>'plan',''),
    'inactive'
  );

  v_origin := coalesce(
    nullif(new.raw_user_meta_data->>'origen',''),
    nullif(new.raw_user_meta_data->>'origin',''),
    'individual'
  );

  begin
    insert into public.profiles (
      user_id, name, email, plan_status, origen, created_at
    ) values (
      new.id, v_name, v_email, v_plan, v_origin, now()
    )
    on conflict (user_id) do nothing;
  exception when others then
    -- Do not block user creation; optionally log using RAISE NOTICE
    raise notice 'handle_new_user: skipping profile insert for % due to: %', new.id, sqlerrm;
  end;

  return new;
end
$$;

-- Ensure trigger exists on auth.users
do $$
begin
  if exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created' and n.nspname = 'auth' and c.relname = 'users'
  ) then
    execute 'drop trigger on_auth_user_created on auth.users';
  end if;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
