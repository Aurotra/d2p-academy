import type { SupabaseClient } from "@supabase/supabase-js";

import { tryCreateServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { CAPACITY_HOLD_ENROLLMENT_STATUSES } from "@/shared/constants/enrollment-status";
import { isStudentParticipantProfile } from "@/shared/utils/student-participant-profile";

/**
 * Returns an error message if the event is at capacity; null if enrollment is allowed.
 * max_capacity null = unlimited.
 * Prefers service role for the count so RLS does not under-count other students.
 */
export async function getEventCapacityBlockReason(
  client: SupabaseClient,
  eventId: string,
): Promise<string | null> {
  const countClient = tryCreateServiceRoleClient() ?? client;

  const { data: event, error: eventError } = await countClient
    .from("events")
    .select("max_capacity")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(eventError.message);
  }

  const maxCapacity = event?.max_capacity;
  if (maxCapacity == null || maxCapacity <= 0) {
    return null;
  }

  const { data: enrollmentRows, error: countError } = await countClient
    .from("enrollments")
    .select(
      `
      id,
      profiles!inner (
        role,
        username
      )
    `,
    )
    .eq("event_id", eventId)
    .in("status", [...CAPACITY_HOLD_ENROLLMENT_STATUSES]);

  if (countError) {
    throw new Error(countError.message);
  }

  const count =
    enrollmentRows?.filter((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile
        ? isStudentParticipantProfile(profile as { role?: string; username?: string | null })
        : false;
    }).length ?? 0;

  if (count >= maxCapacity) {
    return `Bu etkinliğin kontenjanı dolu (${maxCapacity} kişi).`;
  }

  return null;
}
