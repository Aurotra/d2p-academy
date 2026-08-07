import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isProfileComplete, profileProgressOptions } from "@/lib/utils/progress";

export interface ParentOnboardingContext {
  childrenCount: number;
  childEnrollmentCount: number;
  upcomingEventsCount: number;
  firstChildId: string | null;
  firstChildProfileComplete: boolean;
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
    .select(
      "id, full_name, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url, parent_phone, parent_id, created_at",
    )
    .eq("parent_id", parentUserId)
    .eq("role", "student")
    .not("username", "is", null)
    .order("created_at", { ascending: true });

  const childRows = children ?? [];
  const childIds = childRows.map((child) => child.id);
  const childrenCount = childIds.length;
  const firstChild = childRows[0] ?? null;
  const firstChildProfileComplete = firstChild
    ? isProfileComplete(
        {
          full_name: firstChild.full_name,
          gender: firstChild.gender,
          grade_level: firstChild.grade_level,
          school_name: firstChild.school_name,
          city_district: firstChild.city_district,
          experience_data: firstChild.experience_data as {
            coding_experience?: string;
          } | null,
          interests: firstChild.interests,
          motivation_data: firstChild.motivation_data as {
            hedef?: string;
            beklenti?: number;
          } | null,
          profile_avatar_url: firstChild.profile_avatar_url,
          parent_phone: firstChild.parent_phone,
        },
        profileProgressOptions(firstChild),
      )
    : false;

  const [{ count: upcomingEventsCount }, enrollmentResult] = await Promise.all([
    client
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("end_at", new Date().toISOString()),
    childIds.length > 0
      ? client
          .from("enrollments")
          .select("id, user_id, intake_form_completed_at", { count: "exact" })
          .in("user_id", childIds)
          .neq("status", "cancelled")
      : Promise.resolve({ data: [], count: 0 }),
  ]);

  const enrollments = enrollmentResult.data ?? [];
  const childEnrollmentCount = enrollmentResult.count ?? enrollments.length;

  const pendingEnrollment = enrollments.find(
    (enrollment) =>
      enrollment.intake_form_completed_at == null && childIds.includes(enrollment.user_id),
  );

  return {
    childrenCount,
    childEnrollmentCount,
    upcomingEventsCount: upcomingEventsCount ?? 0,
    firstChildId: firstChild?.id ?? null,
    firstChildProfileComplete,
    pendingFormsEnrollment: pendingEnrollment
      ? {
          childId: pendingEnrollment.user_id,
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
