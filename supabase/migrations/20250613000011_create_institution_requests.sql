-- D2P Academy | Migration 011
-- Institutional education requests (kurumsal eğitim talebi).
-- Idempotent: güvenle birden fazla kez çalıştırılabilir.

create table if not exists public.institution_requests (
  id uuid primary key default gen_random_uuid(),
  institution_name text not null,
  institution_type text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  student_count text not null,
  package_interest text not null,
  message text,
  status text not null default 'yeni',
  created_at timestamptz not null default now(),
  constraint institution_requests_type_check check (
    institution_type in (
      'özel okul',
      'devlet okulu',
      'belediye',
      'dershane / kurs',
      'diğer'
    )
  ),
  constraint institution_requests_status_check check (
    status in ('yeni', 'aranıyor', 'teklif verildi', 'anlaşıldı', 'iptal')
  )
);

create index if not exists institution_requests_created_at_idx
  on public.institution_requests (created_at desc);

create index if not exists institution_requests_status_idx
  on public.institution_requests (status);

alter table public.institution_requests enable row level security;

drop policy if exists "institution_requests_anon_insert" on public.institution_requests;
drop policy if exists "institution_requests_authenticated_insert" on public.institution_requests;
drop policy if exists "institution_requests_admin_select" on public.institution_requests;
drop policy if exists "institution_requests_admin_update" on public.institution_requests;

create policy "institution_requests_anon_insert"
on public.institution_requests
for insert
to anon
with check (true);

create policy "institution_requests_authenticated_insert"
on public.institution_requests
for insert
to authenticated
with check (true);

create policy "institution_requests_admin_select"
on public.institution_requests
for select
to authenticated
using (public.is_admin());

create policy "institution_requests_admin_update"
on public.institution_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
