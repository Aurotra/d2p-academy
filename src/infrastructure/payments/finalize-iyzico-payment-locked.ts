import type { SupabaseClient } from "@supabase/supabase-js";

export interface FinalizeIyzicoPaymentResult {
  enrollmentId: string;
  studentUserId: string;
  alreadyPaid: boolean;
  recovered: boolean;
  previousPaymentStatus?: string;
}

interface FinalizeRpcRow {
  ok?: boolean;
  already_paid?: boolean;
  recovered?: boolean;
  enrollment_id?: string;
  student_user_id?: string;
  previous_payment_status?: string;
  error_code?: string;
  error_message?: string;
}

interface CancelStaleRpcRow {
  ok?: boolean;
  skipped?: boolean;
  reason?: string;
  payment_status?: string;
}

/**
 * Finalize payment under row lock. Recovers cancelled/failed → paid when provider succeeded.
 */
export async function finalizeIyzicoPaymentLocked(
  client: SupabaseClient,
  input: {
    paymentId: string;
    providerPaymentId: string | null;
    raw: Record<string, unknown>;
  },
): Promise<FinalizeIyzicoPaymentResult> {
  const { data, error } = await client.rpc("finalize_iyzico_payment", {
    p_payment_id: input.paymentId,
    p_provider_payment_id: input.providerPaymentId,
    p_raw: input.raw,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? {}) as FinalizeRpcRow;
  if (!row.ok) {
    throw new Error(row.error_message ?? "Ödeme tamamlanamadı.");
  }

  if (!row.enrollment_id || !row.student_user_id) {
    throw new Error("Ödeme sonucu eksik.");
  }

  const result: FinalizeIyzicoPaymentResult = {
    enrollmentId: row.enrollment_id,
    studentUserId: row.student_user_id,
    alreadyPaid: Boolean(row.already_paid),
    recovered: Boolean(row.recovered),
    previousPaymentStatus:
      typeof row.previous_payment_status === "string"
        ? row.previous_payment_status
        : undefined,
  };

  if (result.recovered) {
    console.error(
      "[iyzico payment recovered] Stale/failed payment revived after provider SUCCESS",
      {
        paymentId: input.paymentId,
        enrollmentId: result.enrollmentId,
        studentUserId: result.studentUserId,
        previousPaymentStatus: result.previousPaymentStatus,
        providerPaymentId: input.providerPaymentId,
      },
    );
  }

  return result;
}

export async function cancelStalePendingPaymentLocked(
  client: SupabaseClient,
  paymentId: string,
  options?: { alsoCancelEnrollment?: boolean },
): Promise<{ skipped: boolean; reason?: string }> {
  const alsoCancelEnrollment = options?.alsoCancelEnrollment !== false;
  const { data, error } = await client.rpc("cancel_stale_pending_payment", {
    p_payment_id: paymentId,
    p_also_cancel_enrollment: alsoCancelEnrollment,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? {}) as CancelStaleRpcRow;
  return {
    skipped: Boolean(row.skipped),
    reason: row.reason,
  };
}
