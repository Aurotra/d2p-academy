import { StoreCatalog } from "@/presentation/components/store/store-catalog";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { STORE_PRODUCTS } from "@/shared/constants/store-products";
import { storePageMetadata } from "@/shared/seo/public-pages";

export const metadata = storePageMetadata;

export default function StorePage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <StoreCatalog products={STORE_PRODUCTS} />
      </div>
    </PublicPageShell>
  );
}
