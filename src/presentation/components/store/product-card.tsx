import Link from "next/link";

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
  const image = product.images[0];
  const hasCourse = product.educationIntegration.hasDigitalCourse;
  const kitComingSoon = product.educationIntegration.kitVersionStatus === "coming_soon";
  const productComingSoon = product.stockStatus === "coming_soon";

  return (
    <article className={`${BRAND_SURFACE_FEATURE_CARD} flex h-full flex-col overflow-hidden`}>
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-surface-section">
        {image ? (
          // Local store photos / SVGs; next/image blocks SVG by default.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={image.alt}
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5">
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
          <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-bold leading-snug text-navy-950">
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

        <div className="mt-auto flex flex-col gap-3 pt-5">
          <p className="text-2xl font-black leading-none text-navy-950">
            {productComingSoon ? "Yakında" : formatTryPrice(product.price)}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/magaza/${product.slug}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border-surface bg-white px-3 py-2.5 text-center text-sm font-semibold text-navy-950 transition hover:border-secondary/40 hover:bg-surface-tint-green/40"
            >
              Detay
            </Link>
            {productComingSoon ? (
              <span className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-accent-dark/30 bg-accent/20 px-3 py-2.5 text-center text-sm font-bold text-accent-dark">
                Yakında
              </span>
            ) : (
              <Link
                href={`/magaza/${product.slug}/satin-al`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-3 py-2.5 text-center text-sm font-bold text-white transition hover:brightness-105"
              >
                Satın Al
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
