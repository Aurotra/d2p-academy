import type { EventStatus } from "@/core/domain/admin-event";

/** Enrollments for draft/cancelled events are hidden from admin registration lists. */
export const ADMIN_ENROLLMENT_VISIBLE_EVENT_STATUSES: EventStatus[] = ["published", "completed"];

export function isAdminEnrollmentVisibleEventStatus(status: string): status is EventStatus {
  return (ADMIN_ENROLLMENT_VISIBLE_EVENT_STATUSES as readonly string[]).includes(status);
}
