"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { useSiteAuth } from "@/presentation/providers/site-auth-provider";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";
import { scrollToHash } from "@/shared/utils/scroll-to-hash";

const navItems = [
  { href: "/#hero", label: "Ana Sayfa" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: PARENT_GUIDE_PATH, label: "Veli Rehberi" },
  { href: "/#certificate", label: "Sertifika Doğrula" },
  { href: "/galeri", label: "Galeri" },
  { href: "/kurumsal-talep", label: "Kurumsal Talep" },
  { href: "/iletisim", label: "İletişim" },
] as const;

function handleSamePageHashNav(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  pathname: string,
) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return;
  }

  const targetPath = href.slice(0, hashIndex) || "/";
  const hash = href.slice(hashIndex);

  if (targetPath !== pathname) {
    return;
  }

  event.preventDefault();
  scrollToHash(hash);
  window.history.pushState(null, "", `${targetPath}${hash}`);
}

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
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    isAuthResolved,
    isLoggedIn,
    sessionKind,
    userDisplayName,
    panelHref,
    signOut,
  } = useSiteAuth();

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

  async function handleLogout() {
    const redirectKind = sessionKind;
    setIsLoggingOut(true);
    closeMobileMenu();

    try {
      await signOut();
      const destination = redirectKind === "student" ? "/student-login" : "/";
      router.push(destination);
      router.refresh();
    } catch {
      // Keep current session UI if logout fails.
    } finally {
      setIsLoggingOut(false);
    }
  }

  const showGuestAuthActions = isAuthResolved && !isLoggedIn;
  const showLoggedInActions = isAuthResolved && isLoggedIn;

  return (
    <header className="sticky top-0 z-50">
      <div className={`relative z-50 ${BRAND_SURFACE_HEADER}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8">
          <div className="flex shrink-0 items-center">
            <BrandLogo height={48} />
          </div>

          <nav
            className="site-header-nav hidden min-w-0 flex-1 justify-center lg:flex"
            aria-label="Ana menü"
          >
            <ul className="mx-auto flex w-max items-center gap-x-3 xl:gap-x-5 2xl:gap-x-6">
              {navItems.map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className="whitespace-nowrap text-xs font-medium text-navy-900 transition hover:text-primary xl:text-sm"
                    onClick={(event) => handleSamePageHashNav(event, item.href, pathname)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden min-h-[40px] shrink-0 items-center gap-2 lg:flex xl:gap-3">
            {showLoggedInActions ? (
              <>
                {userDisplayName ? (
                  <span className="max-w-[10rem] truncate text-sm font-medium text-muted lg:max-w-[14rem]">
                    {userDisplayName}
                  </span>
                ) : null}
                <Link
                  href={panelHref}
                  className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
                >
                  Panelim
                </Link>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => void handleLogout()}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover hover:shadow-glow-primary disabled:opacity-60"
                >
                  {isLoggingOut ? "Çıkış..." : "Çıkış Yap"}
                </button>
              </>
            ) : null}
            {showGuestAuthActions ? (
              <>
                <AuthPortalLink href="/student-login" kind="student">
                  Öğrenci Girişi
                </AuthPortalLink>
                <AuthPortalLink href="/login" kind="parent">
                  Veli Girişi
                </AuthPortalLink>
                <Link
                  href="/register"
                  className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
                >
                  Hesap Oluştur
                </Link>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="relative z-[60] ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border-surface bg-white/80 p-2.5 text-navy-900 shadow-sm transition hover:border-primary/30 hover:text-primary lg:hidden"
            aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-main-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <MenuIcon open={isMobileMenuOpen} />
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-navy-950/20 backdrop-blur-[2px] lg:hidden"
            aria-label="Menüyü kapat"
            onClick={closeMobileMenu}
          />
          <nav
            id="mobile-main-menu"
            className="fixed inset-x-0 bottom-0 top-20 z-50 overflow-y-auto overscroll-contain border-t border-border-surface bg-gradient-to-b from-surface-base to-surface-section px-4 py-5 shadow-lg shadow-secondary/10 lg:hidden sm:px-6"
            aria-label="Mobil menü"
          >
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center rounded-xl px-4 py-3 text-base font-semibold text-navy-900 transition hover:bg-white/70 hover:text-primary"
                    onClick={(event) => {
                      handleSamePageHashNav(event, item.href, pathname);
                      closeMobileMenu();
                    }}
                  >
                    <span className="mr-3 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex min-h-[52px] flex-col gap-3 border-t border-border-surface pt-5">
              {showLoggedInActions ? (
                <>
                  {userDisplayName ? (
                    <p className="px-1 text-center text-sm font-medium text-muted">
                      {userDisplayName}
                    </p>
                  ) : null}
                  <Link
                    href={panelHref}
                    className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
                    onClick={closeMobileMenu}
                  >
                    Panelim
                  </Link>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover hover:shadow-glow-primary disabled:opacity-60"
                  >
                    {isLoggingOut ? "Çıkış..." : "Çıkış Yap"}
                  </button>
                </>
              ) : null}
              {showGuestAuthActions ? (
                <>
                  <AuthPortalLink
                    href="/student-login"
                    kind="student"
                    block
                    onClick={closeMobileMenu}
                  >
                    Öğrenci Girişi
                  </AuthPortalLink>
                  <AuthPortalLink href="/login" kind="parent" block onClick={closeMobileMenu}>
                    Veli Girişi
                  </AuthPortalLink>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-hover hover:shadow-glow-secondary"
                    onClick={closeMobileMenu}
                  >
                    Hesap Oluştur
                  </Link>
                </>
              ) : null}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
