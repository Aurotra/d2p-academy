import { redirect } from "next/navigation";

import { getStudentDashboard } from "@/core/use-cases/get-student-dashboard";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { SupabaseStudentDashboardRepository } from "@/infrastructure/repositories/supabase-student-dashboard-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { DashboardView } from "@/presentation/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repository = new SupabaseStudentDashboardRepository(client);
  const dashboardData = await getStudentDashboard(repository, user.id);
  const adminAccess = await getAdminAccess(client);

  return <DashboardView data={dashboardData} isAdmin={adminAccess.authorized} />;
}
