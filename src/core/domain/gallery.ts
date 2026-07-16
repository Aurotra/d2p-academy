export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  locationName: string | null;
  eventDate: string | null;
  description: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  photoCount: number;
  createdAt: Date;
}

export interface GalleryPhoto {
  id: string;
  albumId: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
  createdAt: Date;
}

export interface GalleryAlbumDetail extends GalleryAlbum {
  photos: GalleryPhoto[];
}

export interface CreateGalleryAlbumInput {
  title: string;
  locationName?: string | null;
  eventDate?: string | null;
  description?: string;
  isPublished?: boolean;
}

export interface CreateGalleryPhotoInput {
  albumId: string;
  imageUrl: string;
  caption?: string;
}
