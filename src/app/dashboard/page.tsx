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
  const onboardingContext = await fetchParentOnboardingContext(client, user.id);

  if (onboardingContext.childrenCount === 0) {
    redirect(PARENT_DEFAULT_LANDING_PATH);
  }

  let dashboardData: Awaited<ReturnType<typeof getStudentDashboard>>;
  let childrenEnrollments: Awaited<
    ReturnType<typeof fetchParentChildrenEnrollments>
  >["enrollments"] = [];
  let loadError: string | null = null;

  try {
    const [dashboardResult, childrenEnrollmentsResult] = await Promise.all([
      getStudentDashboard(repository, user.id),
      fetchParentChildrenEnrollments(user.id),
    ]);
    dashboardData = dashboardResult;
    childrenEnrollments = childrenEnrollmentsResult.enrollments;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Panel verileri yüklenemedi.";
    console.error("[dashboard]", error);
    dashboardData = {
      profile: {
        id: user.id,
        fullName: user.email?.split("@")[0] ?? "Veli",
        email: user.email ?? "",
        role: "parent",
      },
      upcomingEnrollments: [],
      certificates: [],
    };
  }

  const adminAccess = await getAdminAccess(client);
  const instructorAccess = await getInstructorAccess(client);

  return (
    <DashboardView
      data={dashboardData}
      childrenEnrollments={childrenEnrollments}
      isAdmin={adminAccess.authorized}
      isInstructor={instructorAccess.authorized}
      onboardingContext={onboardingContext}
      showOnboarding={shouldShowParentOnboarding(onboardingContext)}
      loadError={loadError}
    />
  );
}
