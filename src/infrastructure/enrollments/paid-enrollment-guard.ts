import type { SupabaseClient } from "@supabase/supabase-js";

export const PAYMENT_NOT_REFUNDED_WARNING = "payment_not_refunded" as const;

export const PAYMENT_NOT_REFUNDED_MESSAGE =
  "Bu kayıt ücretliydi, iptal edilirken ödeme otomatik iade edilmedi — manuel iade gerekebilir." as const;

export type PaymentNotRefundedWarning = {
  warning: typeof PAYMENT_NOT_REFUNDED_WARNING;
  message: typeof PAYMENT_NOT_REFUNDED_MESSAGE;
  paidEnrollmentIds: string[];
};

/** Snapshot of a paid payment row captured before enrollment hard-delete (CASCADE). */
export type PaidPaymentAuditSnapshot = {
  payment_id: string;
  enrollment_id: string;
  /** Canonical payments.amount_try_cents */
  amount_try_cents: number;
  /** Alias of amount_try_cents for finance/mutabakat readers */
  price_try_cents: number;
  currency: string;
  provider: string;
  status: "paid";
  provider_payment_id: string | null;
  provider_conversation_id: string | null;
  paid_at: string | null;
  created_at: string | null;
};

/**
 * Load paid payment rows for enrollments (before CASCADE delete wipes them).
 */
export async function fetchPaidPaymentsForEnrollments(
  client: SupabaseClient,
  enrollmentIds: string[],
): Promise<Map<string, PaidPaymentAuditSnapshot[]>> {
  const ids = Array.from(new Set(enrollmentIds.map((id) => id.trim()).filter(Boolean)));
  const byEnrollment = new Map<string, PaidPaymentAuditSnapshot[]>();
  if (ids.length === 0) {
    return byEnrollment;
  }

  const { data, error } = await client
    .from("payments")
    .select(
      "id, enrollment_id, amount_try_cents, currency, provider, status, provider_payment_id, provider_conversation_id, paid_at, created_at",
    )
    .in("enrollment_id", ids)
    .eq("status", "paid");

  if (error) {
    throw new Error(`Ödeme kontrolü başarısız: ${error.message}`);
  }

  for (const row of data ?? []) {
    const enrollmentId = row.enrollment_id as string;
    if (!enrollmentId) continue;

    const amountTryCents = row.amount_try_cents as number;
    const snapshot: PaidPaymentAuditSnapshot = {
      payment_id: row.id as string,
      enrollment_id: enrollmentId,
      amount_try_cents: amountTryCents,
      price_try_cents: amountTryCents,
      currency: (row.currency as string) ?? "TRY",
      provider: (row.provider as string) ?? "iyzico",
      status: "paid",
      provider_payment_id: (row.provider_payment_id as string | null) ?? null,
      provider_conversation_id: (row.provider_conversation_id as string | null) ?? null,
      paid_at: (row.paid_at as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
    };

    const list = byEnrollment.get(enrollmentId) ?? [];
    list.push(snapshot);
    byEnrollment.set(enrollmentId, list);
  }

  return byEnrollment;
}

/**
 * Returns enrollment ids that have at least one payments row with status = paid.
 */
export async function findEnrollmentIdsWithPaidPayment(
  client: SupabaseClient,
  enrollmentIds: string[],
): Promise<Set<string>> {
  const paid = await fetchPaidPaymentsForEnrollments(client, enrollmentIds);
  return new Set(paid.keys());
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
