import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminCouponsManager } from "@/presentation/components/admin/admin-coupons-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const client = await createSupabaseServerClient();
  if (!client) {
    redirect("/login");
  }

  const adminAccess = await getAdminAccess(client);
  if (!adminAccess.authorized) {
    redirect("/login");
  }

  return <AdminCouponsManager />;
}
