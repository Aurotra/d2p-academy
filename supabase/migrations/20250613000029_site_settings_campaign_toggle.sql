-- D2P Academy | Migration 029
-- Site settings for admin-togglable campaigns (e.g. Kaklık homepage signup).

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.site_settings enable row level security;

drop policy if exists site_settings_select_public on public.site_settings;
create policy site_settings_select_public
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists site_settings_admin_insert on public.site_settings;
create policy site_settings_admin_insert
on public.site_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists site_settings_admin_update on public.site_settings;
create policy site_settings_admin_update
on public.site_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.site_settings (key, value)
values (
  'kaklik_campaign',
  jsonb_build_object('enabled', true)
)
on conflict (key) do nothing;
