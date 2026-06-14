import Link from "next/link";

import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

const navItems = [
  { href: "/#hero", label: "Ana Sayfa" },
  { href: "/#certificate", label: "Sertifika Doğrula" },
  { href: "/#events", label: "Etkinlikler" },
] as const;

export function SiteHeader() {
  return (
    <header className={`sticky top-0 z-40 ${BRAND_SURFACE_HEADER}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center self-center">
          <BrandLogo height={40} />
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-sky-900 transition hover:text-sky-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-sky-800 transition hover:text-sky-950 sm:inline-flex"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-cyan-400"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </header>
  );
}
