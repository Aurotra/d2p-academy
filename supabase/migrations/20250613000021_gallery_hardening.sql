-- D2P Academy | Migration 021
-- Gallery hardening: soft delete, cover_photo_id, alt_text, thumbs, private bucket.
-- Idempotent.

-- ---------------------------------------------------------------------------
-- 1) gallery_photos columns
-- ---------------------------------------------------------------------------
alter table public.gallery_photos
  add column if not exists storage_path text,
  add column if not exists thumb_storage_path text,
  add column if not exists thumb_url text,
  add column if not exists alt_text text not null default '',
  add column if not exists deleted_at timestamptz;

comment on column public.gallery_photos.storage_path is
  'Path inside gallery bucket for the display WebP (max ~1920px).';
comment on column public.gallery_photos.thumb_storage_path is
  'Path inside gallery bucket for thumbnail WebP (max ~400px).';
comment on column public.gallery_photos.alt_text is
  'Optional accessible alternative text for SEO and screen readers.';

-- Backfill storage_path from public URL when possible (best-effort).
update public.gallery_photos
set storage_path = regexp_replace(image_url, '^.*\/storage\/v1\/object\/public\/gallery\/', '')
where storage_path is null
  and image_url like '%/storage/v1/object/public/gallery/%';

create index if not exists gallery_photos_not_deleted_idx
  on public.gallery_photos (album_id, sort_order)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- 2) gallery_albums: cover_photo_id + soft delete
-- ---------------------------------------------------------------------------
alter table public.gallery_albums
  add column if not exists cover_photo_id uuid,
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'gallery_albums'
      and constraint_name = 'gallery_albums_cover_photo_id_fkey'
  ) then
    alter table public.gallery_albums
      add constraint gallery_albums_cover_photo_id_fkey
      foreign key (cover_photo_id)
      references public.gallery_photos (id)
      on delete set null;
  end if;
end $$;

create index if not exists gallery_albums_not_deleted_idx
  on public.gallery_albums (is_published, sort_order desc, event_date desc nulls last)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- 3) RLS: hide soft-deleted from public
-- ---------------------------------------------------------------------------
drop policy if exists "gallery_albums_select_published_public" on public.gallery_albums;
create policy "gallery_albums_select_published_public"
on public.gallery_albums
for select
to public
using (is_published = true and deleted_at is null);

drop policy if exists "gallery_photos_select_published_public" on public.gallery_photos;
create policy "gallery_photos_select_published_public"
on public.gallery_photos
for select
to public
using (
  deleted_at is null
  and exists (
    select 1
    from public.gallery_albums a
    where a.id = album_id
      and a.is_published = true
      and a.deleted_at is null
  )
);

-- ---------------------------------------------------------------------------
-- 4) Private gallery bucket (signed URLs for display)
-- ---------------------------------------------------------------------------
update storage.buckets
set public = false
where id = 'gallery';

drop policy if exists "gallery_storage_public_read" on storage.objects;

-- Allow creating signed URLs (private objects are still not anonymously downloadable without a token).
drop policy if exists "gallery_storage_signed_read" on storage.objects;
create policy "gallery_storage_signed_read"
on storage.objects
for select
to public
using (bucket_id = 'gallery');

-- ---------------------------------------------------------------------------
-- 5) Soft-delete helpers + 30-day purge
-- ---------------------------------------------------------------------------
create or replace function public.soft_delete_gallery_photo(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Fotoğraf silmek için admin yetkisi gerekli.';
  end if;

  update public.gallery_photos
  set deleted_at = timezone('utc', now())
  where id = p_photo_id
    and deleted_at is null;

  update public.gallery_albums
  set cover_photo_id = null,
      cover_image_url = null,
      updated_at = timezone('utc', now())
  where cover_photo_id = p_photo_id;
end;
$$;

create or replace function public.restore_gallery_photo(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Fotoğraf geri almak için admin yetkisi gerekli.';
  end if;

  update public.gallery_photos
  set deleted_at = null
  where id = p_photo_id;
end;
$$;

create or replace function public.soft_delete_gallery_album(p_album_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Albüm silmek için admin yetkisi gerekli.';
  end if;

  update public.gallery_albums
  set deleted_at = timezone('utc', now()),
      is_published = false,
      updated_at = timezone('utc', now())
  where id = p_album_id
    and deleted_at is null;

  update public.gallery_photos
  set deleted_at = timezone('utc', now())
  where album_id = p_album_id
    and deleted_at is null;
end;
$$;

create or replace function public.restore_gallery_album(p_album_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Albüm geri almak için admin yetkisi gerekli.';
  end if;

  update public.gallery_albums
  set deleted_at = null,
      updated_at = timezone('utc', now())
  where id = p_album_id;

  update public.gallery_photos
  set deleted_at = null
  where album_id = p_album_id
    and deleted_at is not null;
end;
$$;

-- Purges rows soft-deleted > 30 days. Call via Supabase cron / scheduled SQL.
create or replace function public.purge_soft_deleted_gallery(p_older_than_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := timezone('utc', now()) - make_interval(days => p_older_than_days);
  v_count integer := 0;
begin
  delete from public.gallery_photos
  where deleted_at is not null
    and deleted_at < v_cutoff;

  get diagnostics v_count = row_count;

  delete from public.gallery_albums
  where deleted_at is not null
    and deleted_at < v_cutoff;

  return v_count;
end;
$$;

grant execute on function public.soft_delete_gallery_photo(uuid) to authenticated;
grant execute on function public.restore_gallery_photo(uuid) to authenticated;
grant execute on function public.soft_delete_gallery_album(uuid) to authenticated;
grant execute on function public.restore_gallery_album(uuid) to authenticated;
-- purge_soft_deleted_gallery: run manually as postgres / service role (e.g. weekly cron).
