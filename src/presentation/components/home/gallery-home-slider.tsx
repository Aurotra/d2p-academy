"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { GalleryHomePhoto } from "@/core/domain/gallery";

interface GalleryHomeSliderProps {
  photos: GalleryHomePhoto[];
}

export function GalleryHomeSlider({ photos }: GalleryHomeSliderProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (photos.length <= 1) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const timer = window.setInterval(() => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll <= 0) return;
      const next = scroller.scrollLeft + 280;
      scroller.scrollTo({
        left: next >= maxScroll - 8 ? 0 : next,
        behavior: "smooth",
      });
    }, 3800);

    return () => window.clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) {
    return null;
  }

  function scrollBy(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <section id="gallery-preview" className="bg-white px-4 py-14 sm:px-6 lg:px-8">
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

        <div className="relative mt-6">
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Sola kaydır"
                onClick={() => scrollBy(-1)}
                className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:flex"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Sağa kaydır"
                onClick={() => scrollBy(1)}
                className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:flex"
              >
                ›
              </button>
            </>
          ) : null}

          <ul
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((photo) => (
              <li key={photo.id} className="w-[200px] shrink-0 sm:w-[220px]">
                <Link
                  href={photo.albumSlug ? `/galeri/${photo.albumSlug}` : "/galeri"}
                  className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:border-sky-300 hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.altText}
                    className="h-[150px] w-full object-cover sm:h-[160px]"
                    loading="lazy"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
