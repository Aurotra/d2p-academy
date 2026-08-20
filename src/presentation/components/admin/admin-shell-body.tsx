"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import type { AdminPendingCounts } from "@/infrastructure/admin/get-admin-pending-counts";
import { AdminBackLink } from "@/presentation/components/admin/admin-back-link";

interface NavItem {
  href: string;
  label: string;
  countKey?: "institutionRequests" | "courseDemandRequests" | "refundFollowupsOpen" | "stuckCardPayments";
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/students", label: "Öğrenciler" },
  { href: "/admin/parents", label: "Veli İletişim" },
  { href: "/admin/members", label: "Veliler ve Üyeler" },
  { href: "/admin/events", label: "Etkinlikler" },
  { href: "/admin/instructors", label: "Eğitmenler" },
  { href: "/admin/enrollments", label: "Etkinlik Kayıtları" },
  { href: "/admin/payments", label: "Ödemeler", countKey: "stuckCardPayments" },
  { href: "/admin/reports", label: "Raporlar" },
  { href: "/admin/refund-followups", label: "Bekleyen İadeler", countKey: "refundFollowupsOpen" },
  { href: "/admin/forms", label: "Formlar" },
  { href: "/admin/certificates", label: "Sertifikalar" },
  { href: "/admin/logs", label: "İşlem Logları" },
  { href: "/admin/gallery", label: "Galeri" },
  { href: "/admin/documents", label: "Dökümanlar" },
  {
    href: "/admin/institution-requests",
    label: "Kurumsal Talepler",
    countKey: "institutionRequests",
  },
  {
    href: "/admin/course-demand",
    label: "Kurs Talepleri",
    countKey: "courseDemandRequests",
  },
  { href: "/admin/programs", label: "Programlar" },
];

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLinks({
  pendingCounts,
  onNavigate,
}: {
  pendingCounts: AdminPendingCounts;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const count = item.countKey ? pendingCounts[item.countKey] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-white hover:text-document-primary"
          >
            <span>{item.label}</span>
            <CountBadge count={count} />
          </Link>
        );
      })}
    </nav>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
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

interface AdminShellBodyProps {
  pendingCounts: AdminPendingCounts;
  children: ReactNode;
}

export function AdminShellBody({ pendingCounts, children }: AdminShellBodyProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileNavOpen]);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-4 lg:hidden lg:px-8">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-surface bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition hover:border-secondary/40 hover:bg-surface-section"
          aria-expanded={mobileNavOpen}
          aria-controls="admin-mobile-nav"
        >
          <MenuIcon open={false} />
          Admin menüsü
        </button>
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-navy-950/40 lg:hidden"
            aria-label="Menüyü kapat"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            id="admin-mobile-nav"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw-2.5rem,18rem)] flex-col border-r border-border-surface bg-surface-section/95 shadow-2xl backdrop-blur-sm lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-border-surface px-4 py-4">
              <p className="text-sm font-bold text-navy-950">Admin menüsü</p>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Menüyü kapat"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition hover:bg-white"
              >
                <MenuIcon open />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <NavLinks
                pendingCounts={pendingCounts}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </aside>
        </>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:px-8 lg:py-8">
        <aside className="no-print hidden h-fit rounded-2xl border border-border-surface bg-surface-section/80 p-4 shadow-sm lg:block">
          <NavLinks pendingCounts={pendingCounts} />
        </aside>
        <div className="admin-shell-main min-w-0">
          <div className="no-print">
            <AdminBackLink />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
