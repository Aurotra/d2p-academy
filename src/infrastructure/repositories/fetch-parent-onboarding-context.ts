import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ParentOnboardingContext {
  childrenCount: number;
  childEnrollmentCount: number;
  upcomingEventsCount: number;
  pendingFormsEnrollment: {
    childId: string;
    enrollmentId: string;
  } | null;
}

export async function fetchParentOnboardingContext(
  client: SupabaseClient,
  parentUserId: string,
): Promise<ParentOnboardingContext> {
  const { data: children } = await client
    .from("profiles")
    .select("id")
    .eq("parent_id", parentUserId)
    .eq("role", "student")
    .not("username", "is", null);

  const childIds = (children ?? []).map((child) => child.id);
  const childrenCount = childIds.length;

  const [{ count: upcomingEventsCount }, enrollmentResult] = await Promise.all([
    client
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("end_at", new Date().toISOString()),
    childIds.length > 0
      ? client
          .from("enrollments")
          .select("id, student_id, intake_form_completed_at", { count: "exact" })
          .in("student_id", childIds)
          .neq("status", "cancelled")
      : Promise.resolve({ data: [], count: 0 }),
  ]);

  const enrollments = enrollmentResult.data ?? [];
  const childEnrollmentCount = enrollmentResult.count ?? enrollments.length;

  const pendingEnrollment = enrollments.find(
    (enrollment) =>
      enrollment.intake_form_completed_at == null &&
      childIds.includes(enrollment.student_id),
  );

  return {
    childrenCount,
    childEnrollmentCount,
    upcomingEventsCount: upcomingEventsCount ?? 0,
    pendingFormsEnrollment: pendingEnrollment
      ? {
          childId: pendingEnrollment.student_id,
          enrollmentId: pendingEnrollment.id,
        }
      : null,
  };
}

export function shouldShowParentOnboarding(context: ParentOnboardingContext): boolean {
  if (context.childEnrollmentCount === 0) {
    return true;
  }

  return context.pendingFormsEnrollment !== null;
}
