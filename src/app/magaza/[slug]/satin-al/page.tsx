import Link from "next/link";
import { notFound } from "next/navigation";

import { getStoreProductBySlug } from "@/shared/constants/store-products";
import { StoreCheckoutForm } from "@/presentation/components/store/store-checkout-form";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { publicPageMetadata } from "@/shared/seo/metadata";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = getStoreProductBySlug(slug);
  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  return publicPageMetadata({
    title: `Satın Al — ${product.title}`,
    description: `${product.title} (${product.subtitle}) için güvenli PayTR ödeme ve teslimat bilgileri.`,
    path: `/magaza/${product.slug}/satin-al`,
  });
}

export default async function StoreCheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getStoreProductBySlug(slug);
  if (!product) {
    notFound();
  }

  if (product.stockStatus === "coming_soon") {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-black text-navy-950">{product.title}</h1>
          <p className="mt-3 text-base leading-7 text-muted">
            Bu ürün yakında satışa çıkacak. Şimdilik sipariş alınmıyor.
          </p>
          <Link
            href={`/magaza/${product.slug}`}
            className="mt-6 inline-flex font-semibold text-document-primary hover:underline"
          >
            Ürün detayına dön
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Sayfa yolu" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/magaza" className="font-semibold text-document-primary hover:underline">
                Mağaza
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/magaza/${product.slug}`}
                className="font-semibold text-document-primary hover:underline"
              >
                {product.title}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-navy-950">Satın al</li>
          </ol>
        </nav>
        <StoreCheckoutForm product={product} />
      </div>
    </PublicPageShell>
  );
}
