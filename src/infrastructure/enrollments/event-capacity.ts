import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_ENROLLMENT_STATUSES = ["registered", "attended", "completed"] as const;

/**
 * Returns an error message if the event is at capacity; null if enrollment is allowed.
 * max_capacity null = unlimited.
 */
export async function getEventCapacityBlockReason(
  client: SupabaseClient,
  eventId: string,
): Promise<string | null> {
  const { data: event, error: eventError } = await client
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

  const { count, error: countError } = await client
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", [...ACTIVE_ENROLLMENT_STATUSES]);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= maxCapacity) {
    return `Bu etkinliğin kontenjanı dolu (${maxCapacity} kişi).`;
  }

  return null;
}
