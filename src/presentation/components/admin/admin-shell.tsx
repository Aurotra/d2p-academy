import Link from "next/link";
import type { ReactNode } from "react";

import type { Profile } from "@/core/domain/auth";
import type { AdminPendingCounts } from "@/infrastructure/admin/get-admin-pending-counts";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { AdminShellBody } from "@/presentation/components/admin/admin-shell-body";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";

interface AdminShellProps {
  profile: Profile;
  pendingCounts: AdminPendingCounts;
  children: ReactNode;
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

      <AdminShellBody pendingCounts={pendingCounts}>{children}</AdminShellBody>
    </div>
  );
}
