import Link from "next/link";

import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { BRAND_SURFACE_FOOTER } from "@/shared/constants/brand-surfaces";
import { CONTACT } from "@/shared/constants/contact";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 3.691a6.146 6.146 0 100 12.292 6.146 6.146 0 000-12.292zm0 10.155a4.009 4.009 0 110-8.018 4.009 4.009 0 010 8.018zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className={`${BRAND_SURFACE_FOOTER} text-sky-900`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <BrandLogo href="/" height={36} />
          <p className="max-w-xl text-sm text-sky-800">
            Okullara ve öğrencilere yönelik modern, ölçeklenebilir eğitim platformu.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm sm:items-end">
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
              href={PARENT_GUIDE_PATH}
              className="font-semibold text-sky-900 transition hover:text-document-primary"
            >
              Veli Rehberi
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
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-sky-900 transition hover:text-document-primary"
          >
            <InstagramIcon />
            Instagram · @{CONTACT.instagramHandle}
          </a>
          <p className="text-sky-700">
            © {new Date().getFullYear()} D2P Academy. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
