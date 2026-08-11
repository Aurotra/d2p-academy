import Link from "next/link";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { RemoteImage, resolveGalleryPhotoAlt } from "@/presentation/components/ui/remote-image";
import { BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";

type GuideGalleryFigureProps = {
  albumSlug: string;
  photoIndex?: number;
  preferCover?: boolean;
};

export async function GuideGalleryFigure({
  albumSlug,
  photoIndex = 0,
  preferCover = false,
}: GuideGalleryFigureProps) {
  const client = await createSupabaseServerClient();
  if (!client) {
    return null;
  }

  const album = await new SupabaseGalleryRepository(client).getPublishedAlbumBySlug(albumSlug);
  if (!album || album.photos.length === 0) {
    return null;
  }

  const photo =
    (preferCover && album.coverPhotoId
      ? album.photos.find((item) => item.id === album.coverPhotoId)
      : null) ??
    album.photos[Math.min(Math.max(photoIndex, 0), album.photos.length - 1)] ??
    album.photos[0];

  if (!photo) {
    return null;
  }

  const alt = resolveGalleryPhotoAlt({
    altText: photo.altText,
    caption: photo.caption,
    albumTitle: album.title,
  });

  return (
    <figure className={`my-8 overflow-hidden ${BRAND_SURFACE_CARD}`}>
      <div className="relative aspect-[4/3] w-full bg-surface-section">
        <RemoteImage
          src={photo.imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>
      <figcaption className="px-4 py-3 text-sm text-muted">
        {photo.caption ? <span>{photo.caption} · </span> : null}
        <Link href={`/galeri/${album.slug}`} className="font-semibold text-document-primary hover:underline">
          {album.title}
        </Link>
        {" — D2P Academy galeri"}
      </figcaption>
    </figure>
  );
}
