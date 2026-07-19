import { redirect } from "next/navigation";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { fetchUsernameStudentProgress } from "@/infrastructure/repositories/fetch-username-student-progress";
import { tryCreateServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { UsernameStudentDashboardView } from "@/presentation/components/student-dashboard/username-student-dashboard-view";

export default async function StudentDashboardPage() {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  let fullName: string | null = null;
  const service = tryCreateServiceRoleClient();
  if (service) {
    const { data } = await service
      .from("profiles")
      .select("full_name")
      .eq("id", session.sub)
      .maybeSingle();
    fullName = data?.full_name ?? null;
  }

  let progress;
  try {
    progress = await fetchUsernameStudentProgress(session.sub);
  } catch {
    progress = { enrollments: [], certificates: [], badges: [] };
  }

  return (
    <UsernameStudentDashboardView
      username={session.username}
      fullName={fullName}
      progress={progress}
    />
  );
}
