import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/presentation/components/store/product-detail";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import {
  getAllStoreProductSlugs,
  getStoreProductBySlug,
} from "@/shared/constants/store-products";
import { absoluteUrl, publicPageMetadata } from "@/shared/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllStoreProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getStoreProductBySlug(slug);
  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  const image = product.images[0];
  const metadata = publicPageMetadata({
    title: `${product.title} | D2P Academy Mağaza`,
    socialTitle: product.title,
    description: product.description,
    path: `/magaza/${product.slug}`,
    keywords: [
      product.title,
      product.subtitle,
      "D2P Academy mağaza",
      "eğitim kiti",
      "3D baskı kit",
    ],
    absoluteTitle: true,
  });

  if (image) {
    const imageUrl = absoluteUrl(image.src);
    return {
      ...metadata,
      openGraph: {
        ...metadata.openGraph,
        images: [{ url: imageUrl, alt: image.alt }],
      },
      twitter: {
        ...metadata.twitter,
        images: [imageUrl],
      },
    };
  }

  return metadata;
}

function availabilityUrl(status: string): string {
  switch (status) {
    case "in_stock":
      return "https://schema.org/InStock";
    case "pre_order":
      return "https://schema.org/PreOrder";
    default:
      return "https://schema.org/OutOfStock";
  }
}

export default async function StoreProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getStoreProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const image = product.images[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: image ? [absoluteUrl(image.src)] : [],
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "D2P Academy",
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/magaza/${product.slug}`),
      priceCurrency: "TRY",
      price: product.price.toFixed(2),
      availability: availabilityUrl(product.stockStatus),
    },
  };

  return (
    <PublicPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <ProductDetail product={product} />
      </div>
    </PublicPageShell>
  );
}
