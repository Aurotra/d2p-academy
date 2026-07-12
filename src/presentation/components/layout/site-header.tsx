"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

const navItems = [
  { href: "/#hero", label: "Ana Sayfa" },
  { href: "/#certificate", label: "Sertifika Doğrula" },
  { href: "/#events", label: "Etkinlikler" },
  { href: "/iletisim", label: "İletişim" },
] as const;

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <header className={`sticky top-0 z-40 ${BRAND_SURFACE_HEADER}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center self-center">
          <BrandLogo height={48} />
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Ana menü">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-800 transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 transition hover:text-primary"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
          >
            Kayıt Ol
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-white/80 p-2.5 text-slate-800 shadow-sm transition hover:border-primary/30 hover:text-primary md:hidden"
          aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-main-menu"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <MenuIcon open={isMobileMenuOpen} />
        </button>
      </div>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-sky-900/20 backdrop-blur-[2px] md:hidden"
            aria-label="Menüyü kapat"
            onClick={closeMobileMenu}
          />
          <nav
            id="mobile-main-menu"
            className="relative z-40 border-t border-sky-200/80 bg-gradient-to-b from-sky-50 to-sky-100/95 px-4 py-5 shadow-lg shadow-sky-200/40 md:hidden sm:px-6"
            aria-label="Mobil menü"
          >
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center rounded-xl px-4 py-3 text-base font-semibold text-slate-800 transition hover:bg-white/70 hover:text-primary"
                    onClick={closeMobileMenu}
                  >
                    <span className="mr-3 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-3 border-t border-sky-200/80 pt-5">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-primary hover:text-primary"
                onClick={closeMobileMenu}
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
                onClick={closeMobileMenu}
              >
                Kayıt Ol
              </Link>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
