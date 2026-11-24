-- Cloud presentations for instructors (private storage + RBAC assignments)

create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default '',
  storage_path text not null,
  file_name text not null,
  mime_type text not null default 'application/pdf',
  byte_size bigint not null default 0,
  page_count integer not null default 0 check (page_count >= 0),
  is_published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists presentations_published_idx
  on public.presentations (is_published, created_at desc)
  where deleted_at is null;

create table if not exists public.presentation_assignments (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations (id) on delete cascade,
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (presentation_id, instructor_id)
);

create index if not exists presentation_assignments_instructor_idx
  on public.presentation_assignments (instructor_id, created_at desc);

alter table public.presentations enable row level security;
alter table public.presentation_assignments enable row level security;

-- Admins manage everything
create policy presentations_admin_all
  on public.presentations
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy presentation_assignments_admin_all
  on public.presentation_assignments
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Instructors can read published presentations assigned to them
create policy presentations_instructor_select
  on public.presentations
  for select
  using (
    deleted_at is null
    and is_published = true
    and public.is_instructor()
    and exists (
      select 1
      from public.presentation_assignments pa
      where pa.presentation_id = presentations.id
        and pa.instructor_id = auth.uid()
    )
  );

create policy presentation_assignments_instructor_select
  on public.presentation_assignments
  for select
  using (
    public.is_instructor()
    and instructor_id = auth.uid()
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'presentations',
  'presentations',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage: only admins write; reads go through signed URLs (service role / authenticated select for signing)
create policy presentations_storage_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'presentations' and public.is_admin());

create policy presentations_storage_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'presentations' and public.is_admin())
  with check (bucket_id = 'presentations' and public.is_admin());

create policy presentations_storage_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'presentations' and public.is_admin());

-- SELECT needed so createSignedUrl works for authenticated callers who already passed app RBAC
create policy presentations_storage_authenticated_select
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'presentations' and (public.is_admin() or public.is_instructor()));
