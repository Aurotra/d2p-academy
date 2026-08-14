import type { SupabaseClient } from "@supabase/supabase-js";

export const PAYMENT_NOT_REFUNDED_WARNING = "payment_not_refunded" as const;

export const PAYMENT_NOT_REFUNDED_MESSAGE =
  "Bu kayıt ücretliydi, iptal edilirken ödeme otomatik iade edilmedi — manuel iade gerekebilir." as const;

export type PaymentNotRefundedWarning = {
  warning: typeof PAYMENT_NOT_REFUNDED_WARNING;
  message: typeof PAYMENT_NOT_REFUNDED_MESSAGE;
  paidEnrollmentIds: string[];
};

/**
 * Returns enrollment ids that have at least one payments row with status = paid.
 */
export async function findEnrollmentIdsWithPaidPayment(
  client: SupabaseClient,
  enrollmentIds: string[],
): Promise<Set<string>> {
  const ids = Array.from(new Set(enrollmentIds.map((id) => id.trim()).filter(Boolean)));
  if (ids.length === 0) {
    return new Set();
  }

  const { data, error } = await client
    .from("payments")
    .select("enrollment_id")
    .in("enrollment_id", ids)
    .eq("status", "paid");

  if (error) {
    throw new Error(`Ödeme kontrolü başarısız: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.enrollment_id as string).filter(Boolean));
}

export function buildPaymentNotRefundedWarning(
  paidEnrollmentIds: Iterable<string>,
): PaymentNotRefundedWarning | null {
  const ids = Array.from(new Set([...paidEnrollmentIds].filter(Boolean)));
  if (ids.length === 0) {
    return null;
  }

  return {
    warning: PAYMENT_NOT_REFUNDED_WARNING,
    message: PAYMENT_NOT_REFUNDED_MESSAGE,
    paidEnrollmentIds: ids,
  };
}
