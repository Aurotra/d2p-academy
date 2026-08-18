/**
 * Paid checkout after a previous (usually free) enrollment was removed or left behind.
 *
 * reserve_event_enrollment returns already_enrolled only for registered/attended/completed.
 * Former free seats have no paid payment — those must enter checkout, not skip it.
 */
export type PaidCheckoutReserveAction =
  | "proceed"
  | "already_enrolled"
  | "convert_unpaid_to_pending";

export function resolvePaidCheckoutReserveAction(input: {
  alreadyEnrolled: boolean;
  status: string;
  hasPaidPayment: boolean;
}): PaidCheckoutReserveAction {
  if (!input.alreadyEnrolled || input.status === "pending_payment") {
    return "proceed";
  }

  if (input.hasPaidPayment) {
    return "already_enrolled";
  }

  return "convert_unpaid_to_pending";
}
