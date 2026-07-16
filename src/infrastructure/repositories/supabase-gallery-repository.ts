import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateGalleryAlbumInput,
  CreateGalleryPhotoInput,
  GalleryAlbum,
  GalleryAlbumDetail,
  GalleryHomePhoto,
  GalleryPhoto,
} from "@/core/domain/gallery";

const SIGNED_URL_SECONDS = 60 * 60; // 1 hour

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  location_name: string | null;
  event_date: string | null;
  description: string;
  cover_photo_id: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  gallery_photos?: { count: number }[] | null;
}

interface PhotoRow {
  id: string;
  album_id: string;
  image_url: string;
  thumb_url: string | null;
  storage_path: string | null;
  thumb_storage_path: string | null;
  caption: string;
  alt_text: string;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function photoCountFromRow(row: AlbumRow): number {
  const photos = row.gallery_photos;
  if (!photos?.length) return 0;
  if ("count" in photos[0]) {
    return Number(photos[0].count ?? 0);
  }
  return 0;
}

function mapAlbum(row: AlbumRow): GalleryAlbum {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    locationName: row.location_name,
    eventDate: row.event_date,
    description: row.description ?? "",
    coverPhotoId: row.cover_photo_id,
    coverImageUrl: row.cover_image_url,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    photoCount: photoCountFromRow(row),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function mapPhoto(row: PhotoRow): GalleryPhoto {
  return {
    id: row.id,
    albumId: row.album_id,
    imageUrl: row.image_url,
    thumbUrl: row.thumb_url,
    storagePath: row.storage_path,
    thumbStoragePath: row.thumb_storage_path,
    caption: row.caption ?? "",
    altText: row.alt_text ?? "",
    sortOrder: row.sort_order,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
  };
}

const ALBUM_SELECT = `
  id,
  title,
  slug,
  location_name,
  event_date,
  description,
  cover_photo_id,
  cover_image_url,
  is_published,
  sort_order,
  deleted_at,
  created_at,
  gallery_photos!gallery_photos_album_id_fkey ( count )
`;

const PHOTO_SELECT =
  "id, album_id, image_url, thumb_url, storage_path, thumb_storage_path, caption, alt_text, sort_order, deleted_at, created_at";

export class SupabaseGalleryRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async signPath(path: string | null | undefined): Promise<string | null> {
    if (!path) return null;
    const { data, error } = await this.client.storage
      .from("gallery")
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  }

  private async withSignedPhotoUrls(photos: GalleryPhoto[]): Promise<GalleryPhoto[]> {
    return Promise.all(
      photos.map(async (photo) => {
        const signedImage = (await this.signPath(photo.storagePath)) || photo.imageUrl;
        const signedThumb =
          (await this.signPath(photo.thumbStoragePath)) ||
          photo.thumbUrl ||
          signedImage;

        return {
          ...photo,
          imageUrl: signedImage,
          thumbUrl: signedThumb,
        };
      }),
    );
  }

  private async resolveAlbumCover(album: GalleryAlbum, photos: GalleryPhoto[]): Promise<GalleryAlbum> {
    if (album.coverPhotoId) {
      const cover = photos.find((photo) => photo.id === album.coverPhotoId);
      if (cover) {
        return {
          ...album,
          coverImageUrl: cover.thumbUrl || cover.imageUrl,
        };
      }
    }

    if (photos[0]) {
      return {
        ...album,
        coverImageUrl: photos[0].thumbUrl || photos[0].imageUrl,
      };
    }

    if (album.coverImageUrl?.includes("/storage/v1/object/public/gallery/")) {
      const path = album.coverImageUrl.split("/storage/v1/object/public/gallery/")[1];
      const signed = await this.signPath(path);
      return { ...album, coverImageUrl: signed || album.coverImageUrl };
    }

    return album;
  }

  async listPublishedAlbums(): Promise<GalleryAlbum[]> {
    const { data, error } = await this.client
      .from("gallery_albums")
      .select(ALBUM_SELECT)
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .order("event_date", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`Galeri albümleri alınamadı: ${error.message}`);
    }

    const albums = (data as AlbumRow[]).map(mapAlbum);

    return Promise.all(
      albums.map(async (album) => {
        const photos = await this.listPhotos(album.id, false);
        const signedPhotos = await this.withSignedPhotoUrls(photos);
        return this.resolveAlbumCover(
          { ...album, photoCount: signedPhotos.length },
          signedPhotos,
        );
      }),
    );
  }

  async listRecentHomePhotos(limit = 12): Promise<GalleryHomePhoto[]> {
    const { data, error } = await this.client
      .from("gallery_photos")
      .select(
        `
        id,
        album_id,
        image_url,
        thumb_url,
        storage_path,
        thumb_storage_path,
        caption,
        alt_text,
        sort_order,
        deleted_at,
        created_at,
        gallery_albums!gallery_photos_album_id_fkey (
          title,
          slug,
          location_name,
          is_published,
          deleted_at
        )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 3, limit));

    if (error) {
      throw new Error(`Ana sayfa galeri fotoğrafları alınamadı: ${error.message}`);
    }

    type HomeRow = PhotoRow & {
      gallery_albums:
        | {
            title: string;
            slug: string;
            location_name: string | null;
            is_published: boolean;
            deleted_at: string | null;
          }
        | {
            title: string;
            slug: string;
            location_name: string | null;
            is_published: boolean;
            deleted_at: string | null;
          }[]
        | null;
    };

    const rows = (data as HomeRow[]).filter((row) => {
      const album = Array.isArray(row.gallery_albums)
        ? (row.gallery_albums[0] ?? null)
        : row.gallery_albums;
      return album && album.is_published && !album.deleted_at;
    });

    const signed = await this.withSignedPhotoUrls(rows.map(mapPhoto));
    const limited = signed.slice(0, limit);

    return limited.map((photo, index) => {
      const row = rows[index];
      const album = Array.isArray(row.gallery_albums)
        ? (row.gallery_albums[0] ?? null)
        : row.gallery_albums;

      return {
        id: photo.id,
        imageUrl: photo.thumbUrl || photo.imageUrl,
        altText: photo.altText || photo.caption || album?.title || "Eğitim fotoğrafı",
        albumTitle: album?.title ?? "Albüm",
        albumSlug: album?.slug ?? "",
        locationName: album?.location_name ?? null,
      } satisfies GalleryHomePhoto;
    });
  }

  async listAllAlbums(includeDeleted = false): Promise<GalleryAlbum[]> {
    let query = this.client.from("gallery_albums").select(ALBUM_SELECT);

    if (!includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Albümler alınamadı: ${error.message}`);
    }

    return (data as AlbumRow[]).map(mapAlbum);
  }

  async getPublishedAlbumBySlug(slug: string): Promise<GalleryAlbumDetail | null> {
    const { data: album, error } = await this.client
      .from("gallery_albums")
      .select(ALBUM_SELECT)
      .eq("slug", slug)
      .eq("is_published", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Albüm alınamadı: ${error.message}`);
    }

    if (!album) {
      return null;
    }

    const photos = await this.withSignedPhotoUrls(await this.listPhotos(album.id, false));
    const mappedAlbum = await this.resolveAlbumCover(mapAlbum(album as AlbumRow), photos);

    return {
      ...mappedAlbum,
      photoCount: photos.length,
      photos,
    };
  }

  async createAlbum(input: CreateGalleryAlbumInput): Promise<GalleryAlbum> {
    const baseSlug = slugify(input.title) || `album-${Date.now()}`;
    let slug = baseSlug;
    let attempt = 1;

    while (attempt < 20) {
      const { data: existing } = await this.client
        .from("gallery_albums")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const { data, error } = await this.client
      .from("gallery_albums")
      .insert({
        title: input.title.trim(),
        slug,
        location_name: input.locationName?.trim() || null,
        event_date: input.eventDate || null,
        description: input.description?.trim() ?? "",
        is_published: input.isPublished ?? true,
        sort_order: Date.now() % 1_000_000_000,
      })
      .select(ALBUM_SELECT)
      .single();

    if (error || !data) {
      throw new Error(`Albüm oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    return { ...mapAlbum(data as AlbumRow), photoCount: 0 };
  }

  async addPhoto(input: CreateGalleryPhotoInput): Promise<GalleryPhoto> {
    const { count } = await this.client
      .from("gallery_photos")
      .select("id", { count: "exact", head: true })
      .eq("album_id", input.albumId)
      .is("deleted_at", null);

    const { data, error } = await this.client
      .from("gallery_photos")
      .insert({
        album_id: input.albumId,
        image_url: input.imageUrl,
        thumb_url: input.thumbUrl ?? null,
        storage_path: input.storagePath,
        thumb_storage_path: input.thumbStoragePath ?? null,
        caption: input.caption?.trim() ?? "",
        alt_text: input.altText?.trim() ?? "",
        sort_order: count ?? 0,
      })
      .select(PHOTO_SELECT)
      .single();

    if (error || !data) {
      throw new Error(`Fotoğraf eklenemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    const photo = mapPhoto(data as PhotoRow);

    const { data: album } = await this.client
      .from("gallery_albums")
      .select("cover_photo_id, cover_image_url")
      .eq("id", input.albumId)
      .maybeSingle();

    if (album && !album.cover_photo_id) {
      await this.client
        .from("gallery_albums")
        .update({
          cover_photo_id: photo.id,
          cover_image_url: input.thumbUrl || input.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.albumId);
    }

    return photo;
  }

  async listPhotos(albumId: string, includeDeleted = false): Promise<GalleryPhoto[]> {
    let query = this.client.from("gallery_photos").select(PHOTO_SELECT).eq("album_id", albumId);

    if (!includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Fotoğraflar alınamadı: ${error.message}`);
    }

    return (data as PhotoRow[]).map(mapPhoto);
  }

  async softDeletePhoto(photoId: string): Promise<void> {
    const { error } = await this.client.rpc("soft_delete_gallery_photo", {
      p_photo_id: photoId,
    });
    if (error) {
      throw new Error(`Fotoğraf silinemedi: ${error.message}`);
    }
  }

  async restorePhoto(photoId: string): Promise<void> {
    const { error } = await this.client.rpc("restore_gallery_photo", {
      p_photo_id: photoId,
    });
    if (error) {
      throw new Error(`Fotoğraf geri alınamadı: ${error.message}`);
    }
  }

  async softDeleteAlbum(albumId: string): Promise<void> {
    const { error } = await this.client.rpc("soft_delete_gallery_album", {
      p_album_id: albumId,
    });
    if (error) {
      throw new Error(`Albüm silinemedi: ${error.message}`);
    }
  }

  async restoreAlbum(albumId: string): Promise<void> {
    const { error } = await this.client.rpc("restore_gallery_album", {
      p_album_id: albumId,
    });
    if (error) {
      throw new Error(`Albüm geri alınamadı: ${error.message}`);
    }
  }

  async setPublished(albumId: string, isPublished: boolean): Promise<void> {
    const { error } = await this.client
      .from("gallery_albums")
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq("id", albumId);

    if (error) {
      throw new Error(`Albüm güncellenemedi: ${error.message}`);
    }
  }

  async setCoverPhoto(albumId: string, photoId: string): Promise<void> {
    const { data: photo, error: photoError } = await this.client
      .from("gallery_photos")
      .select("id, thumb_url, image_url, thumb_storage_path, storage_path")
      .eq("id", photoId)
      .eq("album_id", albumId)
      .is("deleted_at", null)
      .maybeSingle();

    if (photoError || !photo) {
      throw new Error("Kapak fotoğrafı bulunamadı.");
    }

    const { error } = await this.client
      .from("gallery_albums")
      .update({
        cover_photo_id: photoId,
        cover_image_url: photo.thumb_url || photo.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", albumId);

    if (error) {
      throw new Error(`Kapak güncellenemedi: ${error.message}`);
    }
  }

  async reorderAlbums(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      this.client
        .from("gallery_albums")
        .update({
          sort_order: orderedIds.length - index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      throw new Error(`Albüm sırası kaydedilemedi: ${failed.error.message}`);
    }
  }

  async reorderPhotos(albumId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      this.client
        .from("gallery_photos")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("album_id", albumId),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      throw new Error(`Fotoğraf sırası kaydedilemedi: ${failed.error.message}`);
    }
  }

  async updatePhotoMeta(
    photoId: string,
    input: { caption?: string; altText?: string },
  ): Promise<void> {
    const payload: Record<string, string> = {};
    if (input.caption !== undefined) payload.caption = input.caption.trim();
    if (input.altText !== undefined) payload.alt_text = input.altText.trim();

    const { error } = await this.client.from("gallery_photos").update(payload).eq("id", photoId);
    if (error) {
      throw new Error(`Fotoğraf güncellenemedi: ${error.message}`);
    }
  }
}
