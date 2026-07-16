"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { GalleryHomePhoto } from "@/core/domain/gallery";

interface GalleryHomeSliderProps {
  photos: GalleryHomePhoto[];
}

export function GalleryHomeSlider({ photos }: GalleryHomeSliderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % photos.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) {
    return null;
  }

  const current = photos[index] ?? photos[0];

  return (
    <section id="gallery-preview" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
              Galeri
            </p>
            <h2 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">
              Atölyelerden kareler
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Eğitimlerimizden seçilmiş anlar. Tüm albümler için galeri sayfasına göz atın.
            </p>
          </div>
          <Link
            href="/galeri"
            className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
          >
            Tüm galeri →
          </Link>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-sm">
          <div className="relative aspect-[16/9] sm:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.imageUrl}
              alt={current.altText}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent px-5 py-5 sm:px-8 sm:py-7">
              <p className="text-sm font-semibold text-white sm:text-base">{current.albumTitle}</p>
              {current.locationName ? (
                <p className="mt-1 text-xs text-white/80 sm:text-sm">{current.locationName}</p>
              ) : null}
            </div>
          </div>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Önceki fotoğraf"
                onClick={() =>
                  setIndex((currentIndex) =>
                    currentIndex === 0 ? photos.length - 1 : currentIndex - 1,
                  )
                }
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white sm:left-5"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Sonraki fotoğraf"
                onClick={() => setIndex((currentIndex) => (currentIndex + 1) % photos.length)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white sm:right-5"
              >
                ›
              </button>
              <div className="absolute bottom-4 right-5 flex gap-1.5 sm:bottom-6 sm:right-8">
                {photos.map((photo, photoIndex) => (
                  <button
                    key={photo.id}
                    type="button"
                    aria-label={`Fotoğraf ${photoIndex + 1}`}
                    onClick={() => setIndex(photoIndex)}
                    className={`h-2 w-2 rounded-full transition ${
                      photoIndex === index ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {photos.length > 1 ? (
          <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {photos.map((photo, photoIndex) => (
              <li key={photo.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(photoIndex)}
                  className={`block overflow-hidden rounded-xl border-2 transition ${
                    photoIndex === index
                      ? "border-sky-500"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl || photo.imageUrl}
                    alt=""
                    className="h-16 w-24 object-cover sm:h-20 sm:w-28"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
