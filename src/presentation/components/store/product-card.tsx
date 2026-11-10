import Link from "next/link";

import type { Product } from "@/core/domain/store";
import { BRAND_SURFACE_FEATURE_CARD } from "@/shared/constants/brand-surfaces";
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

  return (
    <article className={`${BRAND_SURFACE_FEATURE_CARD} flex h-full flex-col overflow-hidden`}>
      <div className="relative aspect-[4/3] bg-surface-section">
        {image ? (
          // Local technical SVGs; next/image blocks SVG by default.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-contain p-3"
            draggable={false}
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stockStatusClass(product.stockStatus)}`}
          >
            {stockStatusLabel(product.stockStatus)}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${difficultyClass(product.specs.difficulty)}`}
          >
            {product.specs.difficulty}
          </span>
          {hasCourse ? (
            <span className="rounded-full border border-document-primary/25 bg-document-primary/10 px-2.5 py-1 text-[11px] font-semibold text-document-primary">
              Dijital Eğitim &amp; Aktivasyon Dahil
            </span>
          ) : null}
          {isActivated ? (
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
              Eğitiminiz Aktif
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-bold leading-snug text-navy-950">{product.title}</h3>
          <p className="mt-1 text-sm text-muted">{product.subtitle}</p>
        </div>

        <p className="text-xs font-medium text-subtle">Kurulum: {product.specs.assemblyTime}</p>

        <p className="mt-auto text-2xl font-black text-navy-950">{formatTryPrice(product.price)}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={`/magaza/${product.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-border-surface bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:border-secondary/40 hover:bg-surface-tint-green/40"
          >
            Detay &amp; Kutu İçeriği
          </Link>
          <a
            href={product.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
          >
            Satın Al
          </a>
        </div>
      </div>
    </article>
  );
}
