-- D2P Academy | Migration 014
-- Public certificates storage bucket + pdf_url on certificates table.
-- Idempotent.

-- ---------------------------------------------------------------------------
-- 1) certificates.pdf_url
-- ---------------------------------------------------------------------------
alter table public.certificates
  add column if not exists pdf_url text;

comment on column public.certificates.pdf_url is
  'Public URL of the generated certificate PDF in the certificates storage bucket.';

-- ---------------------------------------------------------------------------
-- 2) certificates storage bucket (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  true,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "certificates_storage_public_read" on storage.objects;
drop policy if exists "certificates_storage_admin_insert" on storage.objects;
drop policy if exists "certificates_storage_admin_update" on storage.objects;
drop policy if exists "certificates_storage_admin_delete" on storage.objects;

create policy "certificates_storage_public_read"
on storage.objects
for select
to public
using (bucket_id = 'certificates');

create policy "certificates_storage_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'certificates' and public.is_admin());

create policy "certificates_storage_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'certificates' and public.is_admin())
with check (bucket_id = 'certificates' and public.is_admin());

create policy "certificates_storage_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'certificates' and public.is_admin());
