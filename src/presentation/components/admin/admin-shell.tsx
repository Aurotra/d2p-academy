import Link from "next/link";
import type { ReactNode } from "react";

import type { Profile } from "@/core/domain/auth";
import { SITE_NAME } from "@/shared/constants/site";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";

const navItems = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/events", label: "Etkinlikler" },
  { href: "/admin/certificates", label: "Sertifikalar" },
];

interface AdminShellProps {
  profile: Profile;
  children: ReactNode;
}

export function AdminShell({ profile, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-navy-800 bg-navy-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Admin Paneli
            </p>
            <h1 className="text-xl font-bold">{SITE_NAME}</h1>
            <p className="text-sm text-cyan-100/70">{profile.fullName} · {profile.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-cyan-200 hover:text-white">
              Öğrenci Paneli
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-navy-900 transition hover:bg-cyan-50 hover:text-cyan-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
