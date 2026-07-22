import Link from "next/link";
import type { ReactNode } from "react";

import type { Profile } from "@/core/domain/auth";
import type { AdminPendingCounts } from "@/infrastructure/admin/get-admin-pending-counts";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { AdminBackLink } from "@/presentation/components/admin/admin-back-link";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";

interface NavItem {
  href: string;
  label: string;
  countKey?: keyof AdminPendingCounts;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/students", label: "Öğrenciler" },
  { href: "/admin/members", label: "Veliler ve Üyeler" },
  { href: "/admin/events", label: "Etkinlikler" },
  { href: "/admin/instructors", label: "Eğitmenler" },
  { href: "/admin/enrollments", label: "Etkinlik Kayıtları" },
  { href: "/admin/forms", label: "Formlar" },
  { href: "/admin/certificates", label: "Sertifikalar" },
  { href: "/admin/logs", label: "İşlem Logları" },
  { href: "/admin/gallery", label: "Galeri" },
  { href: "/admin/documents", label: "Dökümanlar" },
  { href: "/admin/registrations", label: "Ön Kayıtlar", countKey: "registrations" },
  {
    href: "/admin/institution-requests",
    label: "Kurumsal Talepler",
    countKey: "institutionRequests",
  },
];

interface AdminShellProps {
  profile: Profile;
  pendingCounts: AdminPendingCounts;
  children: ReactNode;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminShell({ profile, pendingCounts, children }: AdminShellProps) {
  return (
    <div className="admin-shell-root min-h-screen bg-slate-50">
      <div className={`${BRAND_SURFACE_HEADER} no-print border-b`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BrandLogo href="/" height={36} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Admin Paneli
              </p>
              <p className="text-sm text-sky-800">
                {profile.fullName} · {profile.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-sky-800 hover:text-sky-950">
              Öğrenci Paneli
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="no-print h-fit rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const count = item.countKey ? pendingCounts[item.countKey] : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-navy-900 transition hover:bg-white hover:text-document-primary"
                >
                  <span>{item.label}</span>
                  <CountBadge count={count} />
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="admin-shell-main">
          <div className="no-print">
            <AdminBackLink />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
