import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminCourseDemandManager } from "@/presentation/components/admin/admin-course-demand-manager";

export const dynamic = "force-dynamic";

export default async function AdminCourseDemandPage() {
  const client = await createSupabaseServerClient();
  if (!client) {
    redirect("/login");
  }

  const adminAccess = await getAdminAccess(client);
  if (!adminAccess.authorized) {
    redirect("/login");
  }

  return <AdminCourseDemandManager />;
}
