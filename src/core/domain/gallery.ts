export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  locationName: string | null;
  eventDate: string | null;
  description: string;
  coverPhotoId: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  photoCount: number;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface GalleryPhoto {
  id: string;
  albumId: string;
  imageUrl: string;
  thumbUrl: string | null;
  storagePath: string | null;
  thumbStoragePath: string | null;
  caption: string;
  altText: string;
  sortOrder: number;
  deletedAt: Date | null;
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
  thumbUrl?: string | null;
  storagePath: string;
  thumbStoragePath?: string | null;
  caption?: string;
  altText?: string;
}
