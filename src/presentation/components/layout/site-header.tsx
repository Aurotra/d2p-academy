import Link from "next/link";

import { SITE_NAME, SITE_TAGLINE } from "@/shared/constants/site";

const navItems = [
  { href: "#hero", label: "Ana Sayfa" },
  { href: "#certificate", label: "Sertifika Doğrula" },
  { href: "#events", label: "Etkinlikler" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-sm font-black text-navy-950">
            D2P
          </span>
          <div>
            <p className="text-sm font-bold text-white">{SITE_NAME}</p>
            <p className="text-xs text-cyan-200/80">{SITE_TAGLINE}</p>          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-cyan-100/90 transition hover:text-cyan-300"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:text-white sm:inline-flex"
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
