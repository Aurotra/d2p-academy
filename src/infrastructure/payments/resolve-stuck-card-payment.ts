import type { SupabaseClient } from "@supabase/supabase-js";

import {
  classifyAdminPaymentMethod,
  isStuckCardPayment,
  stuckCardReleasePlan,
} from "@/infrastructure/payments/admin-payment-ledger";
import { cancelStalePendingPaymentLocked } from "@/infrastructure/payments/finalize-iyzico-payment-locked";
import {
  parseTryLiraToCents,
  resolveHavaleAmountTryCents,
} from "@/infrastructure/payments/payment-providers";
import {
  cancelOpenPendingPaymentsKeepingSeat,
  insertPaidHavalePayment,
} from "@/infrastructure/payments/record-havale-payment";

export class StuckPaymentNotActionableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StuckPaymentNotActionableError";
  }
}

async function loadStuckPaymentContext(client: SupabaseClient, paymentId: string) {
  const { data: payment, error } = await client
    .from("payments")
    .select(
      "id, status, provider, created_at, enrollment_id, event_id, payer_user_id, student_user_id, amount_try_cents",
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!payment) {
    throw new StuckPaymentNotActionableError("Ödeme kaydı bulunamadı.");
  }

  const { data: enrollment } = await client
    .from("enrollments")
    .select("id, status, user_id, event_id")
    .eq("id", payment.enrollment_id)
    .maybeSingle();

  if (!enrollment) {
    throw new StuckPaymentNotActionableError("Kayıt bulunamadı.");
  }

  const method = classifyAdminPaymentMethod({ provider: payment.provider as string | null });
  const isStuck = isStuckCardPayment({
    method,
    paymentStatus: String(payment.status),
    enrollmentStatus: String(enrollment.status),
    createdAt: payment.created_at as string,
  });

  return { payment, enrollment, method, isStuck };
}

export async function releaseStuckCardPayment(
  client: SupabaseClient,
  paymentId: string,
): Promise<{ enrollmentId: string; plan: "cancel_pending_and_seat" | "cancel_seat_only" }> {
  const { payment, enrollment, isStuck } = await loadStuckPaymentContext(client, paymentId);
  const plan = stuckCardReleasePlan({
    paymentStatus: String(payment.status),
    enrollmentStatus: String(enrollment.status),
    isStuck,
  });

  if (plan === "not_actionable") {
    throw new StuckPaymentNotActionableError(
      "Bu ödeme takılı kart kuyruğunda değil veya koltuk artık tutulmuyor.",
    );
  }

  if (plan === "cancel_pending_and_seat") {
    const result = await cancelStalePendingPaymentLocked(client, payment.id, {
      alsoCancelEnrollment: true,
    });
    if (result.skipped && result.reason === "not_pending") {
      throw new StuckPaymentNotActionableError(
        "Ödeme artık beklemede değil; koltuk bırakılmadı.",
      );
    }
    return { enrollmentId: enrollment.id as string, plan };
  }

  const { error } = await client
    .from("enrollments")
    .update({ status: "cancelled" })
    .eq("id", enrollment.id)
    .eq("status", "pending_payment");

  if (error) {
    throw new Error(error.message);
  }

  return { enrollmentId: enrollment.id as string, plan };
}

export async function closeStuckCardPaymentWithHavale(
  client: SupabaseClient,
  input: {
    paymentId: string;
    amountTry: string | null;
    receiptNo: string | null;
    note: string | null;
    recordedBy: string;
  },
): Promise<{ enrollmentId: string; havalePaymentId: string }> {
  const { payment, enrollment, isStuck } = await loadStuckPaymentContext(
    client,
    input.paymentId,
  );

  if (!isStuck) {
    throw new StuckPaymentNotActionableError(
      "Bu ödeme takılı kart kuyruğunda değil veya koltuk artık tutulmuyor.",
    );
  }

  const { data: event } = await client
    .from("events")
    .select("price_try_cents")
    .eq("id", payment.event_id)
    .maybeSingle();

  const amountTryCents = resolveHavaleAmountTryCents({
    overrideTryCents: parseTryLiraToCents(input.amountTry ?? ""),
    eventPriceTryCents:
      (payment.amount_try_cents as number | null) ??
      (event?.price_try_cents as number | null) ??
      null,
  });

  await cancelOpenPendingPaymentsKeepingSeat(client, enrollment.id as string);

  const havale = await insertPaidHavalePayment(client, {
    enrollmentId: enrollment.id as string,
    eventId: payment.event_id as string,
    payerUserId: payment.payer_user_id as string,
    studentUserId: payment.student_user_id as string,
    amountTryCents,
    receiptNo: input.receiptNo,
    note: input.note,
    recordedBy: input.recordedBy,
  });

  const { error } = await client
    .from("enrollments")
    .update({ status: "registered" })
    .eq("id", enrollment.id)
    .eq("status", "pending_payment");

  if (error) {
    throw new Error(error.message);
  }

  return { enrollmentId: enrollment.id as string, havalePaymentId: havale.paymentId };
}
