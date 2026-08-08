import { RemoteImage, resolveGalleryPhotoAlt } from "@/presentation/components/ui/remote-image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { galleryPageMetadata } from "@/shared/seo/public-pages";
import { publicPageMetadata } from "@/shared/seo/metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatEventDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = await createSupabaseServerClient();
  if (!client) {
    return galleryPageMetadata;
  }

  const album = await new SupabaseGalleryRepository(client).getPublishedAlbumBySlug(slug);
  if (!album) {
    return { title: "Albüm bulunamadı" };
  }

  const locationLabel = album.locationName ?? "D2P Academy";
  const description =
    album.description ||
    `${album.title} — ${locationLabel} 3D tasarım ve maker atölye fotoğrafları. D2P Academy eğitim galerisi.`;

  return publicPageMetadata({
    title: `${album.title} — Atölye Fotoğraf Albümü`,
    description,
    path: `/galeri/${slug}`,
    keywords: [
      album.title,
      locationLabel,
      "3D baskı atölye fotoğrafları",
      "D2P Academy galeri",
      "Denizli STEM etkinlikleri",
    ],
  });
}

export default async function GalleryAlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    notFound();
  }

  const album = await new SupabaseGalleryRepository(client).getPublishedAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const dateLabel = formatEventDate(album.eventDate);
  const meta = [album.locationName, dateLabel].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-base via-white to-surface-section">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/galeri"
          className="text-sm font-semibold text-document-primary hover:underline"
        >
          ← Tüm albümler
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Galeri
          </p>
          <h1 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl">{album.title}</h1>
          {meta ? <p className="mt-3 text-base text-muted">{meta}</p> : null}
          {album.description ? (
            <p className="mt-4 text-base leading-7 text-muted">{album.description}</p>
          ) : null}
        </div>

        {album.photos.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-dashed border-border-surface bg-white px-6 py-16 text-center text-subtle">
            Bu albümde henüz fotoğraf yok.
          </div>
        ) : (
          <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {album.photos.map((photo) => (
              <li key={photo.id} className="mb-4 break-inside-avoid">
                <figure className="overflow-hidden rounded-2xl border border-border-surface bg-white shadow-sm">
                  <div className="relative aspect-[4/3] w-full">
                    <RemoteImage
                      src={photo.imageUrl}
                      alt={resolveGalleryPhotoAlt({
                        altText: photo.altText,
                        caption: photo.caption,
                        albumTitle: album.title,
                      })}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  {photo.caption ? (
                    <figcaption className="px-3 py-2 text-sm text-muted">
                      {photo.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
