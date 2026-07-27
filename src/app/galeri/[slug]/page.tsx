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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
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
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{album.title}</h1>
          {meta ? <p className="mt-3 text-base text-slate-600">{meta}</p> : null}
          {album.description ? (
            <p className="mt-4 text-base leading-7 text-slate-600">{album.description}</p>
          ) : null}
        </div>

        {album.photos.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            Bu albümde henüz fotoğraf yok.
          </div>
        ) : (
          <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {album.photos.map((photo) => (
              <li key={photo.id} className="mb-4 break-inside-avoid">
                <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.altText || photo.caption || album.title}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  {photo.caption ? (
                    <figcaption className="px-3 py-2 text-sm text-slate-600">
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
