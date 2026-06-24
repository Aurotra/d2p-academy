-- D2P Academy | Migration 007
-- Documents table and public storage bucket for course materials.
-- Idempotent: güvenle birden fazla kez çalıştırılabilir.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_created_at_idx on public.documents (created_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents_select_authenticated" on public.documents;
drop policy if exists "documents_admin_insert" on public.documents;
drop policy if exists "documents_admin_update" on public.documents;
drop policy if exists "documents_admin_delete" on public.documents;

create policy "documents_select_authenticated"
on public.documents
for select
to authenticated
using (true);

create policy "documents_admin_insert"
on public.documents
for insert
to authenticated
with check (public.is_admin());

create policy "documents_admin_update"
on public.documents
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "documents_admin_delete"
on public.documents
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_storage_public_read" on storage.objects;
drop policy if exists "documents_storage_admin_insert" on storage.objects;
drop policy if exists "documents_storage_admin_update" on storage.objects;
drop policy if exists "documents_storage_admin_delete" on storage.objects;

create policy "documents_storage_public_read"
on storage.objects
for select
to public
using (bucket_id = 'documents');

create policy "documents_storage_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents' and public.is_admin());

create policy "documents_storage_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'documents' and public.is_admin())
with check (bucket_id = 'documents' and public.is_admin());

create policy "documents_storage_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents' and public.is_admin());
