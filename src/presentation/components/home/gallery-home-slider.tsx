"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import type { GalleryHomePhoto } from "@/core/domain/gallery";

interface GalleryHomeSliderProps {
  photos: GalleryHomePhoto[];
}

function GalleryPhotoCard({
  photo,
  ariaHidden = false,
  onBroken,
}: {
  photo: GalleryHomePhoto;
  ariaHidden?: boolean;
  onBroken: (photoId: string) => void;
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
          onError={() => onBroken(photo.id)}
        />
      </Link>
    </li>
  );
}

export function GalleryHomeSlider({ photos: initialPhotos }: GalleryHomeSliderProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  useEffect(() => {
    void fetch("/api/v1/gallery/home-photos", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: GalleryHomePhoto[] }) => {
        if (payload.data?.length) {
          setPhotos(payload.data);
          setBrokenIds(new Set());
        }
      })
      .catch(() => {
        // SSR photos remain visible.
      });
  }, []);

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => !brokenIds.has(photo.id)),
    [photos, brokenIds],
  );

  const marqueePhotos = useMemo(() => [...visiblePhotos, ...visiblePhotos], [visiblePhotos]);
  const marqueeDuration = useMemo(
    () => `${Math.max(visiblePhotos.length * 5, 28)}s`,
    [visiblePhotos.length],
  );

  function markBroken(photoId: string) {
    setBrokenIds((current) => {
      if (current.has(photoId)) {
        return current;
      }
      const next = new Set(current);
      next.add(photoId);
      return next;
    });
  }

  if (visiblePhotos.length === 0) {
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
          {visiblePhotos.length > 1 ? (
            <ul className="gallery-marquee-track flex w-max gap-3">
              {marqueePhotos.map((photo, index) => (
                <GalleryPhotoCard
                  key={`${photo.id}-${index}`}
                  photo={photo}
                  ariaHidden={index >= visiblePhotos.length}
                  onBroken={markBroken}
                />
              ))}
            </ul>
          ) : (
            <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <GalleryPhotoCard photo={visiblePhotos[0]} onBroken={markBroken} />
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
