import type { SupabaseClient } from "@supabase/supabase-js";

import { cancelStalePendingPaymentLocked } from "@/infrastructure/payments/finalize-iyzico-payment-locked";
import { HAVALE_PAYMENT_PROVIDER } from "@/infrastructure/payments/payment-providers";

export async function enrollmentHasPaidPayment(
  client: SupabaseClient,
  enrollmentId: string,
): Promise<boolean> {
  const { data } = await client
    .from("payments")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}

export async function cancelOpenPendingPaymentsKeepingSeat(
  client: SupabaseClient,
  enrollmentId: string,
): Promise<void> {
  const { data: openPendings } = await client
    .from("payments")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("status", "pending");

  for (const open of openPendings ?? []) {
    await cancelStalePendingPaymentLocked(client, open.id, {
      alsoCancelEnrollment: false,
    });
  }
}

export async function insertPaidHavalePayment(
  client: SupabaseClient,
  input: {
    enrollmentId: string;
    eventId: string;
    payerUserId: string;
    studentUserId: string;
    amountTryCents: number;
    receiptNo: string | null;
    note: string | null;
    recordedBy: string;
  },
): Promise<{ paymentId: string }> {
  const receiptNo = input.receiptNo?.trim() || null;
  const note = input.note?.trim() || null;

  const { data, error } = await client
    .from("payments")
    .insert({
      enrollment_id: input.enrollmentId,
      event_id: input.eventId,
      payer_user_id: input.payerUserId,
      student_user_id: input.studentUserId,
      amount_try_cents: input.amountTryCents,
      currency: "TRY",
      provider: HAVALE_PAYMENT_PROVIDER,
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_payment_id: receiptNo,
      provider_raw: {
        method: HAVALE_PAYMENT_PROVIDER,
        receipt_no: receiptNo,
        note,
        recorded_by: input.recordedBy,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Havale ödeme kaydı oluşturulamadı.");
  }

  return { paymentId: data.id as string };
}
