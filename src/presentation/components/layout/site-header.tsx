"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

const navItems = [
  { href: "/#hero", label: "Ana Sayfa" },
  { href: "/#certificate", label: "Sertifika Doğrula" },
  { href: "/#events", label: "Etkinlikler" },
  { href: "/galeri", label: "Galeri" },
  { href: "/kurumsal-talep", label: "Kurumsal Talep" },
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
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      return;
    }

    async function resolveDisplayName(userId: string, fallback?: string | null) {
      const { data } = await client!
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      const name = data?.full_name?.trim() || fallback?.trim() || null;
      setUserDisplayName(name);
    }

    void client.auth.getUser().then(({ data }) => {
      const user = data.user;
      setIsLoggedIn(Boolean(user));
      if (user) {
        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null;
        void resolveDisplayName(user.id, metadataName);
      } else {
        setUserDisplayName(null);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setIsLoggedIn(Boolean(user));
      if (user) {
        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null;
        void resolveDisplayName(user.id, metadataName);
      } else {
        setUserDisplayName(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  async function handleLogout() {
    setIsLoggingOut(true);
    closeMobileMenu();

    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Çıkış yapılamadı.");
      }
      setIsLoggedIn(false);
      setUserDisplayName(null);
      router.push("/");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

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
          {isLoggedIn ? (
            <>
              {userDisplayName ? (
                <span className="max-w-[10rem] truncate text-sm font-medium text-slate-700 lg:max-w-[14rem]">
                  {userDisplayName}
                </span>
              ) : null}
              <Link
                href="/dashboard"
                className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
              >
                Panelim
              </Link>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 transition hover:text-primary disabled:opacity-60"
              >
                {isLoggingOut ? "Çıkış..." : "Çıkış Yap"}
              </button>
            </>
          ) : (
            <>
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
                Hesap Oluştur
              </Link>
            </>
          )}
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
              {isLoggedIn ? (
                <>
                  {userDisplayName ? (
                    <p className="px-1 text-center text-sm font-medium text-slate-700">
                      {userDisplayName}
                    </p>
                  ) : null}
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
                    onClick={closeMobileMenu}
                  >
                    Panelim
                  </Link>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-primary hover:text-primary disabled:opacity-60"
                  >
                    {isLoggingOut ? "Çıkış..." : "Çıkış Yap"}
                  </button>
                </>
              ) : (
                <>
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
                    Hesap Oluştur
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
