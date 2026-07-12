import Link from "next/link";
import type { ReactNode } from "react";

import type { Profile } from "@/core/domain/auth";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { AdminBackLink } from "@/presentation/components/admin/admin-back-link";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";

const navItems = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/students", label: "Öğrenciler" },
  { href: "/admin/events", label: "Etkinlikler" },
  { href: "/admin/enrollments", label: "Etkinlik Kayıtları" },
  { href: "/admin/certificates", label: "Sertifikalar" },
  { href: "/admin/documents", label: "Dökümanlar" },
  { href: "/admin/registrations", label: "Ön Kayıtlar" },
  { href: "/admin/institution-requests", label: "Kurumsal Talepler" },
];

interface AdminShellProps {
  profile: Profile;
  children: ReactNode;
}

export function AdminShell({ profile, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`${BRAND_SURFACE_HEADER} border-b`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BrandLogo href="/admin" height={36} />
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
        <aside className="h-fit rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-navy-900 transition hover:bg-white hover:text-document-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>
          <AdminBackLink />
          {children}
        </div>
      </div>
    </div>
  );
}
