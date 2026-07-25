-- D2P Academy | Migration 048
-- Program definitions (duration lookup for course demand; no FK on course_demand_requests).

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  program_code text not null unique,
  name text not null,
  duration_weeks numeric,
  duration_hours numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint programs_program_code_format check (program_code ~ '^[A-Z]{2,4}$'),
  constraint programs_name_not_blank check (char_length(trim(name)) > 0)
);

create index programs_is_active_idx on public.programs (is_active);

alter table public.programs enable row level security;

drop policy if exists programs_select_all on public.programs;
create policy programs_select_all
  on public.programs
  for select
  to anon, authenticated
  using (true);

drop policy if exists programs_insert_admin on public.programs;
create policy programs_insert_admin
  on public.programs
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists programs_update_admin on public.programs;
create policy programs_update_admin
  on public.programs
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists programs_delete_admin on public.programs;
create policy programs_delete_admin
  on public.programs
  for delete
  to authenticated
  using (public.is_admin());

insert into public.programs (program_code, name, duration_weeks, duration_hours, is_active)
values
  ('DC', 'Design Camp', null, null, true),
  ('TT', 'Teknoloji Atölyesi', null, null, true),
  ('YK', 'Yaz Kampı', null, null, true),
  ('YT', 'Yazılım Temelleri', null, null, true),
  ('IM', 'İleri Maker', null, null, true),
  ('KYK', 'Kış Yoğun Kamp', null, null, true),
  ('ADV', 'İleri 3D', null, null, true)
on conflict (program_code) do nothing;
