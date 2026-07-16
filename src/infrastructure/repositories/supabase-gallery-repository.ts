import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateGalleryAlbumInput,
  CreateGalleryPhotoInput,
  GalleryAlbum,
  GalleryAlbumDetail,
  GalleryPhoto,
} from "@/core/domain/gallery";

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  location_name: string | null;
  event_date: string | null;
  description: string;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  gallery_photos?: { count: number }[] | { id: string }[] | null;
}

interface PhotoRow {
  id: string;
  album_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
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
  if (!photos) return 0;
  if (Array.isArray(photos) && photos.length > 0 && "count" in photos[0]) {
    return Number((photos[0] as { count: number }).count ?? 0);
  }
  if (Array.isArray(photos)) {
    return photos.length;
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
    coverImageUrl: row.cover_image_url,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    photoCount: photoCountFromRow(row),
    createdAt: new Date(row.created_at),
  };
}

function mapPhoto(row: PhotoRow): GalleryPhoto {
  return {
    id: row.id,
    albumId: row.album_id,
    imageUrl: row.image_url,
    caption: row.caption ?? "",
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseGalleryRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listPublishedAlbums(): Promise<GalleryAlbum[]> {
    const { data, error } = await this.client
      .from("gallery_albums")
      .select(
        `
        id,
        title,
        slug,
        location_name,
        event_date,
        description,
        cover_image_url,
        is_published,
        sort_order,
        created_at,
        gallery_photos ( count )
      `,
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: false })
      .order("event_date", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`Galeri albümleri alınamadı: ${error.message}`);
    }

    return (data as AlbumRow[]).map(mapAlbum);
  }

  async listAllAlbums(): Promise<GalleryAlbum[]> {
    const { data, error } = await this.client
      .from("gallery_albums")
      .select(
        `
        id,
        title,
        slug,
        location_name,
        event_date,
        description,
        cover_image_url,
        is_published,
        sort_order,
        created_at,
        gallery_photos ( count )
      `,
      )
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
      .select(
        `
        id,
        title,
        slug,
        location_name,
        event_date,
        description,
        cover_image_url,
        is_published,
        sort_order,
        created_at
      `,
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      throw new Error(`Albüm alınamadı: ${error.message}`);
    }

    if (!album) {
      return null;
    }

    const { data: photos, error: photosError } = await this.client
      .from("gallery_photos")
      .select("id, album_id, image_url, caption, sort_order, created_at")
      .eq("album_id", album.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (photosError) {
      throw new Error(`Fotoğraflar alınamadı: ${photosError.message}`);
    }

    const mappedPhotos = (photos as PhotoRow[]).map(mapPhoto);
    const mappedAlbum = mapAlbum(album as AlbumRow);

    return {
      ...mappedAlbum,
      photoCount: mappedPhotos.length,
      photos: mappedPhotos,
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
      .select(
        `
        id,
        title,
        slug,
        location_name,
        event_date,
        description,
        cover_image_url,
        is_published,
        sort_order,
        created_at
      `,
      )
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
      .eq("album_id", input.albumId);

    const { data, error } = await this.client
      .from("gallery_photos")
      .insert({
        album_id: input.albumId,
        image_url: input.imageUrl,
        caption: input.caption?.trim() ?? "",
        sort_order: count ?? 0,
      })
      .select("id, album_id, image_url, caption, sort_order, created_at")
      .single();

    if (error || !data) {
      throw new Error(`Fotoğraf eklenemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    const photo = mapPhoto(data as PhotoRow);

    const { data: album } = await this.client
      .from("gallery_albums")
      .select("cover_image_url")
      .eq("id", input.albumId)
      .maybeSingle();

    if (album && !album.cover_image_url) {
      await this.client
        .from("gallery_albums")
        .update({ cover_image_url: photo.imageUrl })
        .eq("id", input.albumId);
    }

    return photo;
  }

  async listPhotos(albumId: string): Promise<GalleryPhoto[]> {
    const { data, error } = await this.client
      .from("gallery_photos")
      .select("id, album_id, image_url, caption, sort_order, created_at")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Fotoğraflar alınamadı: ${error.message}`);
    }

    return (data as PhotoRow[]).map(mapPhoto);
  }

  async deletePhoto(photoId: string): Promise<void> {
    const { error } = await this.client.from("gallery_photos").delete().eq("id", photoId);
    if (error) {
      throw new Error(`Fotoğraf silinemedi: ${error.message}`);
    }
  }

  async deleteAlbum(albumId: string): Promise<void> {
    const { error } = await this.client.from("gallery_albums").delete().eq("id", albumId);
    if (error) {
      throw new Error(`Albüm silinemedi: ${error.message}`);
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
}
