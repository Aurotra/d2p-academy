import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAdminPendingCounts } from "@/infrastructure/admin/get-admin-pending-counts";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminShell } from "@/presentation/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    redirect(access.reason === "unauthenticated" ? "/login?redirectTo=/admin" : "/dashboard");
  }

  const pendingCounts = await getAdminPendingCounts(client);

  return (
    <AdminShell profile={access.profile} pendingCounts={pendingCounts}>
      {children}
    </AdminShell>
  );
}
