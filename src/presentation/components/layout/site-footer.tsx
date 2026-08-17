import Link from "next/link";

import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { BRAND_SURFACE_FOOTER } from "@/shared/constants/brand-surfaces";
import { COMPANY, LEGAL_PATHS } from "@/shared/constants/company";
import { CONTACT } from "@/shared/constants/contact";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 3.691a6.146 6.146 0 100 12.292 6.146 6.146 0 000-12.292zm0 10.155a4.009 4.009 0 110-8.018 4.009 4.009 0 010 8.018zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  );
}

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0110 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const discoverLinks = [
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/galeri", label: "Galeri" },
  { href: "/iletisim", label: "İletişim" },
  { href: PARENT_GUIDE_PATH, label: "Veli Rehberi" },
  { href: "/rehber", label: "Makaleler" },
] as const;

const legalLinks = [
  { href: LEGAL_PATHS.about, label: "Hakkımızda" },
  { href: LEGAL_PATHS.privacy, label: "Gizlilik Sözleşmesi" },
  { href: LEGAL_PATHS.deliveryRefund, label: "Teslimat ve İade Şartları" },
  { href: LEGAL_PATHS.distanceSales, label: "Mesafeli Satış Sözleşmesi" },
  { href: LEGAL_PATHS.kvkk, label: "KVKK Aydınlatma" },
] as const;

export function SiteFooter() {
  return (
    <footer className={`${BRAND_SURFACE_FOOTER} text-navy-900`}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <BrandLogo href="/" height={36} />
            <p className="text-sm font-semibold leading-6 text-navy-950">{COMPANY.legalName}</p>
            <p className="max-w-md text-sm leading-6 text-muted">
              {COMPANY.brandName} ({COMPANY.brandDomain}) — eğitim teknolojileri, 3D tasarım/üretim
              atölyeleri ve teknik eğitimler.
            </p>
            <div className="space-y-1 text-sm leading-6 text-[var(--text-on-surface-soft)]">
              <p>{COMPANY.addressFull}</p>
              <p>
                E-posta:{" "}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="font-semibold text-navy-950 underline-offset-2 hover:underline"
                >
                  {CONTACT.email}
                </a>
              </p>
              <p>
                Telefon:{" "}
                <a
                  href={`tel:${CONTACT.phoneTel}`}
                  className="font-semibold text-navy-950 underline-offset-2 hover:underline"
                >
                  {CONTACT.phoneDisplay}
                </a>
              </p>
              <p>MERSİS: {COMPANY.mersisNo}</p>
            </div>
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy-900 transition hover:text-document-primary"
            >
              <InstagramIcon />
              Instagram · @{CONTACT.instagramHandle}
            </a>
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-950">Keşfet</p>
            <ul className="mt-3 space-y-1">
              {discoverLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-navy-900 transition hover:text-document-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-950">
              Kurumsal &amp; Yasal
            </p>
            <ul className="mt-3 space-y-1">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-10 items-center text-sm font-semibold text-navy-900 transition hover:text-document-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-navy-900/10 pt-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-950">
                Güvenli ödeme
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/payments/paytr-mark.svg"
                  alt="PayTR"
                  width={80}
                  height={32}
                  className="h-7 w-auto sm:h-8"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/payments/card-logo-band.svg"
                  alt="Visa, Mastercard, American Express, Troy"
                  width={300}
                  height={32}
                  className="h-7 w-auto max-w-full sm:h-8"
                />
              </div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-on-surface-soft)]">
                <LockIcon className="h-4 w-4 shrink-0 text-document-primary" />
                Sitemizde 256-bit SSL güvenlik sertifikası kullanılmaktadır.
              </p>
            </div>
            <p className="text-sm text-subtle lg:text-right">
              © {new Date().getFullYear()} {COMPANY.brandName}. {COMPANY.legalName}. Tüm hakları
              saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
