import { redirect } from "next/navigation";

import { getStudentDashboard } from "@/core/use-cases/get-student-dashboard";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";
import { fetchParentChildrenEnrollments } from "@/infrastructure/repositories/fetch-parent-children-enrollments";
import {
  fetchParentOnboardingContext,
  shouldShowParentOnboarding,
} from "@/infrastructure/repositories/fetch-parent-onboarding-context";
import { SupabaseStudentDashboardRepository } from "@/infrastructure/repositories/supabase-student-dashboard-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { DashboardView } from "@/presentation/components/dashboard/dashboard-view";
import { PARENT_DEFAULT_LANDING_PATH } from "@/shared/utils/auth-redirect";

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
  const [dashboardData, childrenEnrollmentsData] = await Promise.all([
    getStudentDashboard(repository, user.id),
    fetchParentChildrenEnrollments(user.id),
  ]);
  const onboardingContext = await fetchParentOnboardingContext(client, user.id);

  if (onboardingContext.childrenCount === 0) {
    redirect(PARENT_DEFAULT_LANDING_PATH);
  }

  const adminAccess = await getAdminAccess(client);
  const instructorAccess = await getInstructorAccess(client);

  return (
    <DashboardView
      data={dashboardData}
      childrenEnrollments={childrenEnrollmentsData.enrollments}
      isAdmin={adminAccess.authorized}
      isInstructor={instructorAccess.authorized}
      onboardingContext={onboardingContext}
      showOnboarding={shouldShowParentOnboarding(onboardingContext)}
    />
  );
}
