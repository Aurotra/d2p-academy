-- D2P Academy | Migration 010
-- Pre-registration (ön kayıt) table for September period intake.
-- Idempotent: güvenle birden fazla kez çalıştırılabilir.

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  grade text not null,
  course text not null,
  status text not null default 'yeni',
  created_at timestamptz not null default now(),
  constraint registrations_phone_unique unique (phone),
  constraint registrations_status_check check (
    status in ('yeni', 'aranıyor', 'kayıt tamamlandı', 'iptal')
  )
);

create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
create index if not exists registrations_status_idx on public.registrations (status);

alter table public.registrations enable row level security;

drop policy if exists "registrations_anon_insert" on public.registrations;
drop policy if exists "registrations_authenticated_insert" on public.registrations;
drop policy if exists "registrations_admin_select" on public.registrations;
drop policy if exists "registrations_admin_update" on public.registrations;

create policy "registrations_anon_insert"
on public.registrations
for insert
to anon
with check (true);

create policy "registrations_authenticated_insert"
on public.registrations
for insert
to authenticated
with check (true);

create policy "registrations_admin_select"
on public.registrations
for select
to authenticated
using (public.is_admin());

create policy "registrations_admin_update"
on public.registrations
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
