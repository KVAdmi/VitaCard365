-- Ensure profiles table has personal fields required by the app
alter table if exists public.profiles
  add column if not exists blood_type text,
  add column if not exists phone text,
  add column if not exists curp text,
  add column if not exists birth_date date;

-- Keep existing policies; no changes needed here
