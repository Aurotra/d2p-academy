import type { ReactNode } from "react";

import type { Profile } from "@/core/domain/auth";
import type { AdminPendingCounts } from "@/infrastructure/admin/get-admin-pending-counts";
import { BRAND_SURFACE_HEADER } from "@/shared/constants/brand-surfaces";
import { AdminShellBody } from "@/presentation/components/admin/admin-shell-body";
import { LogoutButton } from "@/presentation/components/dashboard/logout-button";
import {
  PanelShortcutGroup,
  PanelShortcutLink,
} from "@/presentation/components/dashboard/panel-shortcut-link";

interface AdminShellProps {
  profile: Profile;
  pendingCounts: AdminPendingCounts;
  isInstructor: boolean;
  children: ReactNode;
}

export function AdminShell({
  profile,
  pendingCounts,
  isInstructor,
  children,
}: AdminShellProps) {
  return (
    <div className="admin-shell-root min-h-screen bg-surface-section">
      <div className={`${BRAND_SURFACE_HEADER} no-print border-b`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                Admin Paneli
              </p>
              <p className="text-sm text-navy-900">
                {profile.fullName} · {profile.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <PanelShortcutGroup>
              <PanelShortcutLink
                href="/dashboard"
                title="Veli"
                caption="Veli paneline git"
                variant="parent"
              />
              {isInstructor ? (
                <PanelShortcutLink
                  href="/instructor"
                  title="Eğitmen"
                  caption="Eğitmen paneline git"
                  variant="instructor"
                />
              ) : null}
              <PanelShortcutLink
                href="/admin"
                title="Admin"
                caption="Admin paneline git"
                variant="admin"
                isActive
              />
            </PanelShortcutGroup>
            <LogoutButton />
          </div>
        </div>
      </div>

      <AdminShellBody pendingCounts={pendingCounts}>{children}</AdminShellBody>
    </div>
  );
}
