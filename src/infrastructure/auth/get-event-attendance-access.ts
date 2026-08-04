import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";

export type EventAttendanceAccessResult =
  | { authorized: true; userId: string; canEdit: true; role: "admin" | "instructor" }
  | { authorized: false; reason: "unauthenticated" | "forbidden" | "not_found" };

export async function getEventAttendanceAccess(
  client: SupabaseClient,
  eventId: string,
): Promise<EventAttendanceAccessResult> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const { data: event, error } = await client
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return { authorized: false, reason: "not_found" };
  }

  const adminAccess = await getAdminAccess(client);
  if (adminAccess.authorized) {
    return { authorized: true, userId: user.id, canEdit: true, role: "admin" };
  }

  const instructorAccess = await getInstructorAccess(client);
  if (instructorAccess.authorized) {
    const { data: assignment, error: assignmentError } = await client
      .from("event_instructors")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("instructor_id", user.id)
      .maybeSingle();

    if (!assignmentError && assignment) {
      return { authorized: true, userId: user.id, canEdit: true, role: "instructor" };
    }

    const { data: legacyEvent, error: legacyError } = await client
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("instructor_id", user.id)
      .maybeSingle();

    if (!legacyError && legacyEvent) {
      return { authorized: true, userId: user.id, canEdit: true, role: "instructor" };
    }
  }

  return { authorized: false, reason: "forbidden" };
}
