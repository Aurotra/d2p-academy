-- D2P Academy | Migration 009
-- Extended student profile fields for onboarding wizard.

alter table public.profiles
  add column if not exists gender text,
  add column if not exists grade_level text,
  add column if not exists school_name text,
  add column if not exists city_district text,
  add column if not exists experience_data jsonb not null default '{}'::jsonb,
  add column if not exists interests text[] not null default '{}'::text[],
  add column if not exists motivation_data jsonb not null default '{}'::jsonb,
  add column if not exists profile_avatar_url text,
  add column if not exists kvkk_accepted boolean not null default false;

create index if not exists profiles_grade_level_idx on public.profiles (grade_level);
