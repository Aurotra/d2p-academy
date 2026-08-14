import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildPaymentNotRefundedWarning,
  fetchPaidPaymentsForEnrollments,
  type PaymentNotRefundedWarning,
} from "@/infrastructure/enrollments/paid-enrollment-guard";
import { openRefundFollowupsForPaidPayments } from "@/infrastructure/enrollments/open-refund-followups";

/**
 * Soft-cancel enrollments (status=cancelled). Opens refund_followups for any paid payments.
 */
export async function softCancelEnrollmentsWithRefundGuard(
  client: SupabaseClient,
  input: {
    enrollmentIds: string[];
    actorId: string;
    reason: string | null;
  },
): Promise<{
  data: Array<{ id: string; status: string; completed_at: string | null; event_id: string }>;
  paymentWarning: PaymentNotRefundedWarning | null;
}> {
  const enrollmentIds = Array.from(
    new Set(input.enrollmentIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (enrollmentIds.length === 0) {
    throw new Error("İptal edilecek kayıt seçilmedi.");
  }

  const { data: existing, error: fetchError } = await client
    .from("enrollments")
    .select("id, user_id, event_id, status")
    .in("id", enrollmentIds);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const foundIds = new Set((existing ?? []).map((row) => row.id as string));
  const missing = enrollmentIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error("Seçilen kayıtlardan biri bulunamadı.");
  }

  const paidPaymentsByEnrollment = await fetchPaidPaymentsForEnrollments(client, enrollmentIds);
  const paymentWarning = buildPaymentNotRefundedWarning(paidPaymentsByEnrollment.keys());
  const paidPayments = [...paidPaymentsByEnrollment.values()].flat();

  if (paidPayments.length > 0) {
    const contextByEnrollmentId = new Map(
      (existing ?? []).map((row) => [
        row.id as string,
        {
          eventId: (row.event_id as string | null) ?? null,
          studentId: (row.user_id as string | null) ?? null,
        },
      ]),
    );

    await openRefundFollowupsForPaidPayments(client, {
      payments: paidPayments,
      contextByEnrollmentId,
      cancelledBy: input.actorId,
      reason: input.reason,
    });
  }

  const { data, error } = await client
    .from("enrollments")
    .update({
      status: "cancelled",
      completed_at: null,
    })
    .in("id", enrollmentIds)
    .select("id, status, completed_at, event_id");

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data ?? []) as Array<{
      id: string;
      status: string;
      completed_at: string | null;
      event_id: string;
    }>,
    paymentWarning,
  };
}
