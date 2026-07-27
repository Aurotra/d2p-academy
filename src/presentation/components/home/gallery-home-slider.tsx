"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";

import type { GalleryHomePhoto } from "@/core/domain/gallery";

interface GalleryHomeSliderProps {
  photos: GalleryHomePhoto[];
}

function GalleryPhotoCard({
  photo,
  ariaHidden = false,
}: {
  photo: GalleryHomePhoto;
  ariaHidden?: boolean;
}) {
  return (
    <li className="w-[200px] shrink-0 sm:w-[220px]" aria-hidden={ariaHidden || undefined}>
      <Link
        href={photo.albumSlug ? `/galeri/${photo.albumSlug}` : "/galeri"}
        className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:border-sky-300 hover:shadow-md"
        tabIndex={ariaHidden ? -1 : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={ariaHidden ? "" : photo.altText}
          className="h-[150px] w-full object-cover sm:h-[160px]"
          loading="lazy"
          draggable={false}
        />
      </Link>
    </li>
  );
}

export function GalleryHomeSlider({ photos }: GalleryHomeSliderProps) {
  const marqueePhotos = useMemo(() => [...photos, ...photos], [photos]);
  const marqueeDuration = useMemo(
    () => `${Math.max(photos.length * 5, 28)}s`,
    [photos.length],
  );

  if (photos.length === 0) {
    return null;
  }

  return (
    <section id="gallery-preview" className="border-t border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
              Galeri
            </p>
            <h2 className="mt-2 text-2xl font-black text-navy-950 sm:text-3xl">
              Atölyelerden kareler
            </h2>
          </div>
          <Link
            href="/galeri"
            className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
          >
            Tüm galeri →
          </Link>
        </div>

        <div
          className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
          style={{ "--gallery-marquee-duration": marqueeDuration } as CSSProperties}
        >
          {photos.length > 1 ? (
            <ul className="gallery-marquee-track flex w-max gap-3">
              {marqueePhotos.map((photo, index) => (
                <GalleryPhotoCard
                  key={`${photo.id}-${index}`}
                  photo={photo}
                  ariaHidden={index >= photos.length}
                />
              ))}
            </ul>
          ) : (
            <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <GalleryPhotoCard photo={photos[0]} />
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
