"use client";

import Link from "next/link";
import { useState } from "react";

import type { Product } from "@/core/domain/store";
import { BRAND_SURFACE_FEATURE_CARD } from "@/shared/constants/brand-surfaces";
import { STORE_CATEGORY_CARD_LABELS } from "@/shared/constants/store-products";
import { formatTryPrice } from "@/shared/utils/format-try";
import {
  difficultyClass,
  stockStatusClass,
  stockStatusLabel,
} from "@/presentation/components/store/store-labels";

interface ProductCardProps {
  product: Product;
  isActivated: boolean;
}

export function ProductCard({ product, isActivated }: ProductCardProps) {
  const gallery = product.images.slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex] ?? gallery[0];
  const hasCourse = product.educationIntegration.hasDigitalCourse;
  const kitComingSoon = product.educationIntegration.kitVersionStatus === "coming_soon";
  const productComingSoon = product.stockStatus === "coming_soon";
  const detailHref = `/magaza/${product.slug}`;

  return (
    <article
      className={`${BRAND_SURFACE_FEATURE_CARD} group relative flex h-full flex-col overflow-hidden transition hover:border-secondary/35 hover:shadow-lg hover:shadow-secondary/10`}
    >
      <div className="shrink-0 bg-surface-section">
        <Link
          href={detailHref}
          className="relative block aspect-[4/3] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          aria-label={`${product.title} detayına git`}
        >
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
              draggable={false}
            />
          ) : null}
        </Link>

        {gallery.length > 1 ? (
          <div
            className={`grid gap-1 border-t border-border-surface/70 bg-white p-1.5 ${
              gallery.length === 2 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {gallery.map((img, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Görsel ${index + 1}`}
                  aria-pressed={selected}
                  className={`relative aspect-[4/3] overflow-hidden rounded-md border transition ${
                    selected
                      ? "border-secondary ring-2 ring-secondary/30"
                      : "border-border-surface hover:border-secondary/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <Link
        href={detailHref}
        className="flex min-h-0 flex-1 flex-col p-5 text-inherit no-underline outline-none focus-visible:bg-surface-tint-green/20"
      >
        <div className="flex min-h-[52px] flex-wrap content-start gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stockStatusClass(product.stockStatus)}`}
          >
            {stockStatusLabel(product.stockStatus)}
          </span>
          <span className="rounded-full border border-border-surface bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-900">
            {STORE_CATEGORY_CARD_LABELS[product.category]}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${difficultyClass(product.specs.difficulty)}`}
          >
            {product.specs.difficulty}
          </span>
          {hasCourse ? (
            <span className="rounded-full border border-document-primary/25 bg-document-primary/10 px-2.5 py-1 text-[11px] font-semibold text-document-primary">
              Eğitim dahil
            </span>
          ) : null}
          {isActivated ? (
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
              Eğitiminiz aktif
            </span>
          ) : null}
          {kitComingSoon ? (
            <span className="rounded-full border border-accent-dark/30 bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-accent-dark">
              DIY kiti yakında
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-bold leading-snug text-navy-950 group-hover:text-document-primary">
            {product.title}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">{product.subtitle}</p>
        </div>

        {kitComingSoon ? (
          <p className="mt-3 rounded-xl border border-accent-dark/20 bg-accent/15 px-3 py-2 text-xs leading-5 text-accent-dark">
            Kurulu hazır cihaz olarak satılır. DIY eğitim kiti yakında eklenecek.
          </p>
        ) : null}

        <p className="mt-3 line-clamp-1 text-xs font-medium text-subtle">
          Kurulum: {product.specs.assemblyTime}
        </p>

        <p className="mt-auto pt-5 text-2xl font-black leading-none text-navy-950">
          {productComingSoon ? "Yakında" : formatTryPrice(product.price)}
        </p>
      </Link>

      <div className="px-5 pb-5">
        {productComingSoon ? (
          <span className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-accent-dark/30 bg-accent/20 px-3 py-2.5 text-center text-sm font-bold text-accent-dark">
            Yakında satışa çıkacak
          </span>
        ) : (
          <Link
            href={`/magaza/${product.slug}/satin-al`}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-primary px-3 py-2.5 text-center text-sm font-bold text-white transition hover:brightness-105"
          >
            Satın Al
          </Link>
        )}
      </div>
    </article>
  );
}
