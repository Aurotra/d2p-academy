import type { EnrollmentStatus } from "@/core/domain/student-dashboard";

/** Confirmed seats (post-payment / free registration). */
export const ACTIVE_ENROLLMENT_STATUSES = ["registered", "attended", "completed"] as const;

/** Capacity hold includes unpaid checkout seats. */
export const CAPACITY_HOLD_ENROLLMENT_STATUSES = [
  "pending_payment",
  "registered",
  "attended",
  "completed",
] as const;

export type ActiveEnrollmentStatus = (typeof ACTIVE_ENROLLMENT_STATUSES)[number];

export function isActiveEnrollmentStatus(status: string): status is ActiveEnrollmentStatus {
  return (ACTIVE_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

export function isAttendanceEligibleEnrollmentStatus(status: EnrollmentStatus | string): boolean {
  return isActiveEnrollmentStatus(status);
}
