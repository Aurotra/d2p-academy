import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildEventEnrollmentFinanceSummary,
  type EventEnrollmentFinanceSummary,
} from "@/infrastructure/enrollments/event-enrollment-finance-summary";

export async function fetchEventEnrollmentFinanceSummary(
  client: SupabaseClient,
  eventId: string,
): Promise<EventEnrollmentFinanceSummary | null> {
  const { data: event, error: eventError } = await client
    .from("events")
    .select("id, max_capacity, is_paid, payment_mode")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!event) {
    return null;
  }

  const [{ data: enrollments, error: enrollmentError }, { data: payments, error: paymentError }, { count: openRefunds, error: refundError }] =
    await Promise.all([
      client.from("enrollments").select("status").eq("event_id", eventId),
      client
        .from("payments")
        .select("amount_try_cents")
        .eq("event_id", eventId)
        .eq("status", "paid"),
      client
        .from("refund_followups")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "open"),
    ]);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }
  if (paymentError) {
    throw new Error(paymentError.message);
  }
  if (refundError) {
    throw new Error(refundError.message);
  }

  return buildEventEnrollmentFinanceSummary({
    paymentMode: (event.payment_mode as string | null) ?? null,
    isPaid: Boolean(event.is_paid),
    maxCapacity: (event.max_capacity as number | null) ?? null,
    paidAmountTryCents: (payments ?? []).map((row) => row.amount_try_cents as number),
    enrollmentStatuses: (enrollments ?? []).map((row) => String(row.status)),
    openRefundFollowupCount: openRefunds ?? 0,
  });
}
