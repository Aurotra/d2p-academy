import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildPaymentCallbackUrl,
  initializeIyzicoCheckout,
  isIyzicoConfigured,
} from "@/infrastructure/payments/iyzico-client";
import { getClientIp } from "@/lib/utils/request-ip";

const PENDING_PAYMENT_TTL_MS = 45 * 60 * 1000;

export interface PaidEnrollmentCheckoutResult {
  enrollmentId: string;
  paymentId: string;
  paymentPageUrl: string;
  requiresPayment: true;
  eventTitle: string;
  amountTryCents: number;
}

interface StartPaidEnrollmentInput {
  serviceClient: SupabaseClient;
  request: Request;
  studentId: string;
  studentName: string;
  eventId: string;
  eventTitle: string;
  priceTryCents: number;
  payerUserId: string;
  payerFullName: string;
  payerEmail: string;
  payerPhone?: string | null;
  payerCity?: string | null;
}

function splitName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: "Veli", surname: "Kullanici" };
  if (parts.length === 1) return { name: parts[0]!, surname: parts[0]! };
  return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1]! };
}

/**
 * Creates/reuses pending_payment enrollment + payments row, starts iyzico Checkout Form.
 */
export async function startPaidEnrollmentCheckout(
  input: StartPaidEnrollmentInput,
): Promise<PaidEnrollmentCheckoutResult> {
  if (!isIyzicoConfigured()) {
    throw new Error(
      "Bu etkinlik ücretli ancak ödeme sistemi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin.",
    );
  }

  if (input.priceTryCents <= 0) {
    throw new Error("Etkinlik ücreti geçersiz.");
  }

  const { serviceClient } = input;

  // Cancel stale pending payments for this student+event
  const cutoff = new Date(Date.now() - PENDING_PAYMENT_TTL_MS).toISOString();
  const { data: stalePayments } = await serviceClient
    .from("payments")
    .select("id, enrollment_id")
    .eq("student_user_id", input.studentId)
    .eq("event_id", input.eventId)
    .eq("status", "pending")
    .lt("created_at", cutoff);

  for (const stale of stalePayments ?? []) {
    await serviceClient
      .from("payments")
      .update({ status: "cancelled" })
      .eq("id", stale.id)
      .eq("status", "pending");
    if (stale.enrollment_id) {
      await serviceClient
        .from("enrollments")
        .update({ status: "cancelled" })
        .eq("id", stale.enrollment_id)
        .eq("status", "pending_payment");
    }
  }

  const { data: existingEnrollment } = await serviceClient
    .from("enrollments")
    .select("id, status")
    .eq("user_id", input.studentId)
    .eq("event_id", input.eventId)
    .maybeSingle();

  if (
    existingEnrollment &&
    existingEnrollment.status !== "cancelled" &&
    existingEnrollment.status !== "pending_payment"
  ) {
    throw new Error("ALREADY_ENROLLED");
  }

  let enrollmentId = existingEnrollment?.id ?? null;

  if (existingEnrollment?.status === "pending_payment") {
    enrollmentId = existingEnrollment.id;
  } else if (existingEnrollment?.status === "cancelled") {
    const { data: revived, error: reviveError } = await serviceClient
      .from("enrollments")
      .update({ status: "pending_payment", completed_at: null })
      .eq("id", existingEnrollment.id)
      .select("id")
      .single();
    if (reviveError || !revived) {
      throw new Error("Kayıt yenilenemedi.");
    }
    enrollmentId = revived.id;
  } else {
    const { data: inserted, error: insertError } = await serviceClient
      .from("enrollments")
      .insert({
        user_id: input.studentId,
        event_id: input.eventId,
        status: "pending_payment",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      if (insertError?.code === "23505") {
        throw new Error("ALREADY_ENROLLED");
      }
      throw new Error(insertError?.message ?? "Kayıt oluşturulamadı.");
    }
    enrollmentId = inserted.id;
  }

  // Cancel any other open pending payment rows for this enrollment
  await serviceClient
    .from("payments")
    .update({ status: "cancelled" })
    .eq("enrollment_id", enrollmentId)
    .eq("status", "pending");

  const { data: payment, error: paymentError } = await serviceClient
    .from("payments")
    .insert({
      enrollment_id: enrollmentId,
      event_id: input.eventId,
      payer_user_id: input.payerUserId,
      student_user_id: input.studentId,
      amount_try_cents: input.priceTryCents,
      currency: "TRY",
      provider: "iyzico",
      status: "pending",
      provider_conversation_id: undefined,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Ödeme kaydı oluşturulamadı.");
  }

  // Use payment.id as conversationId for idempotent retrieve
  await serviceClient
    .from("payments")
    .update({ provider_conversation_id: payment.id })
    .eq("id", payment.id);

  const { name, surname } = splitName(input.payerFullName);
  const init = await initializeIyzicoCheckout({
    conversationId: payment.id,
    priceTryCents: input.priceTryCents,
    basketId: `EVT-${input.eventId.slice(0, 8)}`,
    basketItemId: input.eventId,
    basketItemName: input.eventTitle,
    callbackUrl: buildPaymentCallbackUrl(),
    buyer: {
      id: input.payerUserId,
      name,
      surname,
      email: input.payerEmail,
      gsmNumber: input.payerPhone,
      ip: getClientIp(input.request) ?? "85.34.78.112",
      city: input.payerCity,
    },
  });

  await serviceClient
    .from("payments")
    .update({
      provider_token: init.token,
      provider_raw: init.checkoutFormContent
        ? { checkoutFormContent: init.checkoutFormContent }
        : null,
    })
    .eq("id", payment.id);

  if (!init.paymentPageUrl && !init.checkoutFormContent) {
    throw new Error("iyzico ödeme sayfası alınamadı.");
  }

  // Prefer hosted page URL; fallback embeds checkout form HTML.
  return {
    enrollmentId,
    paymentId: payment.id,
    paymentPageUrl: init.paymentPageUrl
      ? init.paymentPageUrl
      : `/odeme/${payment.id}?embed=1`,
    requiresPayment: true,
    eventTitle: input.eventTitle,
    amountTryCents: input.priceTryCents,
  };
}

export async function finalizePaidPayment(params: {
  serviceClient: SupabaseClient;
  paymentId: string;
  providerPaymentId: string | null;
  raw: Record<string, unknown>;
}): Promise<{ enrollmentId: string; studentUserId: string; alreadyPaid: boolean }> {
  const { serviceClient, paymentId, providerPaymentId, raw } = params;

  const { data: payment, error } = await serviceClient
    .from("payments")
    .select("id, status, enrollment_id, student_user_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !payment) {
    throw new Error("Ödeme kaydı bulunamadı.");
  }

  if (payment.status === "paid") {
    return {
      enrollmentId: payment.enrollment_id,
      studentUserId: payment.student_user_id,
      alreadyPaid: true,
    };
  }

  const { error: payUpdateError } = await serviceClient
    .from("payments")
    .update({
      status: "paid",
      provider_payment_id: providerPaymentId,
      provider_raw: raw,
      paid_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("status", "pending");

  if (payUpdateError) {
    throw new Error(payUpdateError.message);
  }

  const { error: enrollError } = await serviceClient
    .from("enrollments")
    .update({ status: "registered", completed_at: null })
    .eq("id", payment.enrollment_id)
    .in("status", ["pending_payment", "cancelled"]);

  if (enrollError) {
    throw new Error(enrollError.message);
  }

  return {
    enrollmentId: payment.enrollment_id,
    studentUserId: payment.student_user_id,
    alreadyPaid: false,
  };
}

export async function markPaymentFailed(params: {
  serviceClient: SupabaseClient;
  paymentId: string;
  raw: Record<string, unknown>;
}): Promise<void> {
  const { serviceClient, paymentId, raw } = params;

  await serviceClient
    .from("payments")
    .update({
      status: "failed",
      provider_raw: raw,
    })
    .eq("id", paymentId)
    .eq("status", "pending");
}
