import Link from "next/link";

import { BRAND_SURFACE_FOOTER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

export function SiteFooter() {
  return (
    <footer className={`${BRAND_SURFACE_FOOTER} text-sky-900`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BrandLogo href="/" height={36} />
          <p className="max-w-xl text-sm text-sky-800">
            Okullara ve öğrencilere yönelik modern, ölçeklenebilir eğitim platformu.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href="/galeri"
              className="font-semibold text-sky-900 transition hover:text-document-primary"
            >
              Galeri
            </Link>
            <Link
              href="/iletisim"
              className="font-semibold text-sky-900 transition hover:text-document-primary"
            >
              İletişim
            </Link>
            <Link
              href="/kvkk"
              className="font-semibold text-sky-900 transition hover:text-document-primary"
            >
              KVKK
            </Link>
            <Link
              href="/gizlilik"
              className="font-semibold text-sky-900 transition hover:text-document-primary"
            >
              Gizlilik
            </Link>
          </div>
          <p className="text-sky-700">
            © {new Date().getFullYear()} D2P Academy. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
