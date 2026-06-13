import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminShell } from "@/presentation/components/admin/admin-shell";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    redirect(access.reason === "unauthenticated" ? "/login?redirectTo=/admin" : "/dashboard");
  }

  return <AdminShell profile={access.profile}>{children}</AdminShell>;
}
