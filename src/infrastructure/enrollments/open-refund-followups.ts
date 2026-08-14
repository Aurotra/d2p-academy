import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaidPaymentAuditSnapshot } from "@/infrastructure/enrollments/paid-enrollment-guard";

export interface OpenRefundFollowupInput {
  payments: PaidPaymentAuditSnapshot[];
  contextByEnrollmentId: Map<
    string,
    {
      eventId: string | null;
      studentId: string | null;
    }
  >;
  cancelledBy: string;
  reason: string | null;
}

/**
 * Insert open refund_followups for paid snapshots.
 * Idempotent when the same provider_payment_id already has an open row.
 */
export async function openRefundFollowupsForPaidPayments(
  client: SupabaseClient,
  input: OpenRefundFollowupInput,
): Promise<{ inserted: number }> {
  if (input.payments.length === 0) {
    return { inserted: 0 };
  }

  let inserted = 0;

  for (const payment of input.payments) {
    const ctx = input.contextByEnrollmentId.get(payment.enrollment_id);
    const { error } = await client.from("refund_followups").insert({
      enrollment_id: payment.enrollment_id,
      event_id: ctx?.eventId ?? null,
      student_id: ctx?.studentId ?? null,
      amount_try_cents: payment.amount_try_cents,
      provider_payment_id: payment.provider_payment_id,
      provider: payment.provider,
      paid_at: payment.paid_at,
      cancelled_by: input.cancelledBy,
      reason: input.reason,
      status: "open",
    });

    if (!error) {
      inserted += 1;
      continue;
    }

    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      continue;
    }

    throw new Error(`İade takip kaydı açılamadı: ${error.message}`);
  }

  return { inserted };
}
