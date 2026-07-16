-- D2P Academy | Migration 020
-- Public gallery albums + photos + storage bucket.
-- Idempotent.

-- ---------------------------------------------------------------------------
-- 1) gallery_albums
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  location_name text,
  event_date date,
  description text not null default '',
  cover_image_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gallery_albums_title_not_blank check (char_length(trim(title)) > 0),
  constraint gallery_albums_slug_not_blank check (char_length(trim(slug)) > 0)
);

create index if not exists gallery_albums_published_sort_idx
  on public.gallery_albums (is_published, sort_order desc, event_date desc nulls last);

comment on table public.gallery_albums is
  'Photo albums for training/workshop galleries shown on the public site.';

-- ---------------------------------------------------------------------------
-- 2) gallery_photos
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums (id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint gallery_photos_image_url_not_blank check (char_length(trim(image_url)) > 0)
);

create index if not exists gallery_photos_album_sort_idx
  on public.gallery_photos (album_id, sort_order asc, created_at asc);

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

drop policy if exists "gallery_albums_select_published_public" on public.gallery_albums;
drop policy if exists "gallery_albums_select_admin" on public.gallery_albums;
drop policy if exists "gallery_albums_admin_insert" on public.gallery_albums;
drop policy if exists "gallery_albums_admin_update" on public.gallery_albums;
drop policy if exists "gallery_albums_admin_delete" on public.gallery_albums;

create policy "gallery_albums_select_published_public"
on public.gallery_albums
for select
to public
using (is_published = true);

create policy "gallery_albums_select_admin"
on public.gallery_albums
for select
to authenticated
using (public.is_admin());

create policy "gallery_albums_admin_insert"
on public.gallery_albums
for insert
to authenticated
with check (public.is_admin());

create policy "gallery_albums_admin_update"
on public.gallery_albums
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "gallery_albums_admin_delete"
on public.gallery_albums
for delete
to authenticated
using (public.is_admin());

drop policy if exists "gallery_photos_select_published_public" on public.gallery_photos;
drop policy if exists "gallery_photos_select_admin" on public.gallery_photos;
drop policy if exists "gallery_photos_admin_insert" on public.gallery_photos;
drop policy if exists "gallery_photos_admin_update" on public.gallery_photos;
drop policy if exists "gallery_photos_admin_delete" on public.gallery_photos;

create policy "gallery_photos_select_published_public"
on public.gallery_photos
for select
to public
using (
  exists (
    select 1
    from public.gallery_albums a
    where a.id = album_id
      and a.is_published = true
  )
);

create policy "gallery_photos_select_admin"
on public.gallery_photos
for select
to authenticated
using (public.is_admin());

create policy "gallery_photos_admin_insert"
on public.gallery_photos
for insert
to authenticated
with check (public.is_admin());

create policy "gallery_photos_admin_update"
on public.gallery_photos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "gallery_photos_admin_delete"
on public.gallery_photos
for delete
to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4) storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gallery_storage_public_read" on storage.objects;
drop policy if exists "gallery_storage_admin_insert" on storage.objects;
drop policy if exists "gallery_storage_admin_update" on storage.objects;
drop policy if exists "gallery_storage_admin_delete" on storage.objects;

create policy "gallery_storage_public_read"
on storage.objects
for select
to public
using (bucket_id = 'gallery');

create policy "gallery_storage_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'gallery' and public.is_admin());

create policy "gallery_storage_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'gallery' and public.is_admin())
with check (bucket_id = 'gallery' and public.is_admin());

create policy "gallery_storage_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'gallery' and public.is_admin());
