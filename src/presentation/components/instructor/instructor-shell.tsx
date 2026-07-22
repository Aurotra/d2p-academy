import Link from "next/link";
import type { ReactNode } from "react";

import type { Profile } from "@/core/domain/auth";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";

interface InstructorShellProps {
  profile: Profile;
  children: ReactNode;
}

export function InstructorShell({ profile, children }: InstructorShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`${BRAND_SURFACE_HEADER} border-b`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BrandLogo href="/" height={36} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Eğitmen Paneli
              </p>
              <p className="text-sm font-semibold text-sky-950">{profile.fullName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/instructor"
              className="text-sm font-semibold text-sky-900 hover:underline"
            >
              Etkinliklerim
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
