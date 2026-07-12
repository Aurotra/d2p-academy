import Link from "next/link";

import { BRAND_SURFACE_FOOTER } from "@/shared/constants/brand-surfaces";
import { CONTACT } from "@/shared/constants/contact";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

export function SiteFooter() {
  return (
    <footer className={`${BRAND_SURFACE_FOOTER} text-sky-900`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <BrandLogo href="/" height={36} />
          <div>
            <p className="max-w-xl text-sm leading-6 text-sky-800">
              Okullara ve öğrencilere yönelik modern, ölçeklenebilir eğitim platformu.
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-sky-800">{CONTACT.addressFull}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/iletisim"
            className="font-semibold text-sky-900 transition hover:text-document-primary"
          >
            İletişim
          </Link>
          <a
            href={`tel:${CONTACT.phoneTel}`}
            className="text-sky-800 transition hover:text-document-primary"
          >
            {CONTACT.phoneDisplay}
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-sky-800 transition hover:text-document-primary"
          >
            {CONTACT.email}
          </a>
          <p className="mt-3 text-sky-700">
            © {new Date().getFullYear()} D2P Academy. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
