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
    .select("id, instructor_id")
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
  if (instructorAccess.authorized && event.instructor_id === user.id) {
    return { authorized: true, userId: user.id, canEdit: true, role: "instructor" };
  }

  return { authorized: false, reason: "forbidden" };
}
