import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CapacityFullError,
  tryReserveCapacityAndEnroll,
} from "@/infrastructure/enrollments/try-reserve-capacity-and-enroll";
import {
  cancelStalePendingPaymentLocked,
  finalizeIyzicoPaymentLocked,
} from "@/infrastructure/payments/finalize-iyzico-payment-locked";
import { isCardCheckoutConfigured, resolveCardCheckoutProvider } from "@/infrastructure/payments/card-checkout-provider";
import {
  buildPaymentCallbackUrl,
  initializeIyzicoCheckout,
} from "@/infrastructure/payments/iyzico-client";
import { initializePaytrCheckout } from "@/infrastructure/payments/paytr-client";
import { merchantOidFromPaymentId } from "@/infrastructure/payments/paytr-hash";
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
 * Creates/reuses pending_payment enrollment + payments row, then starts card checkout.
 * Capacity reserve is atomic (RPC). Stale pending cancel uses row locks.
 */
export async function startPaidEnrollmentCheckout(
  input: StartPaidEnrollmentInput,
): Promise<PaidEnrollmentCheckoutResult> {
  if (!isCardCheckoutConfigured()) {
    throw new Error(
      "Bu etkinlik ücretli ancak ödeme sistemi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin.",
    );
  }

  const provider = resolveCardCheckoutProvider();

  if (input.priceTryCents <= 0) {
    throw new Error("Etkinlik ücreti geçersiz.");
  }

  const { serviceClient } = input;

  const cutoff = new Date(Date.now() - PENDING_PAYMENT_TTL_MS).toISOString();
  const { data: stalePayments } = await serviceClient
    .from("payments")
    .select("id")
    .eq("student_user_id", input.studentId)
    .eq("event_id", input.eventId)
    .eq("status", "pending")
    .lt("created_at", cutoff);

  for (const stale of stalePayments ?? []) {
    await cancelStalePendingPaymentLocked(serviceClient, stale.id);
  }

  let reserved;
  try {
    reserved = await tryReserveCapacityAndEnroll(serviceClient, {
      eventId: input.eventId,
      userId: input.studentId,
      targetStatus: "pending_payment",
      enrollmentSource: "parent",
    });
  } catch (error) {
    if (error instanceof CapacityFullError) {
      throw error;
    }
    throw error;
  }

  if (
    reserved.alreadyEnrolled &&
    reserved.status !== "pending_payment"
  ) {
    throw new Error("ALREADY_ENROLLED");
  }

  const enrollmentId = reserved.enrollmentId;

  const { data: openPendings } = await serviceClient
    .from("payments")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("status", "pending");

  for (const open of openPendings ?? []) {
    // Keep enrollment seat; only retire prior pending payment rows under row lock.
    await cancelStalePendingPaymentLocked(serviceClient, open.id, {
      alsoCancelEnrollment: false,
    });
  }

  const { data: payment, error: paymentError } = await serviceClient
    .from("payments")
    .insert({
      enrollment_id: enrollmentId,
      event_id: input.eventId,
      payer_user_id: input.payerUserId,
      student_user_id: input.studentId,
      amount_try_cents: input.priceTryCents,
      currency: "TRY",
      provider,
      status: "pending",
      provider_conversation_id: undefined,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Ödeme kaydı oluşturulamadı.");
  }

  const conversationId =
    provider === "paytr" ? merchantOidFromPaymentId(payment.id) : payment.id;

  await serviceClient
    .from("payments")
    .update({ provider_conversation_id: conversationId })
    .eq("id", payment.id);

  const { name, surname } = splitName(input.payerFullName);
  const buyerIp = getClientIp(input.request) ?? "85.34.78.112";

  if (provider === "paytr") {
    const init = await initializePaytrCheckout({
      paymentId: payment.id,
      priceTryCents: input.priceTryCents,
      eventTitle: input.eventTitle,
      buyer: {
        name: input.payerFullName,
        email: input.payerEmail,
        phone: input.payerPhone,
        ip: buyerIp,
      },
    });

    await serviceClient
      .from("payments")
      .update({
        provider_token: init.token,
        provider_raw: { iframeUrl: init.iframeUrl, merchantOid: init.merchantOid },
      })
      .eq("id", payment.id);

    return {
      enrollmentId,
      paymentId: payment.id,
      paymentPageUrl: `/odeme/${payment.id}?embed=1`,
      requiresPayment: true,
      eventTitle: input.eventTitle,
      amountTryCents: input.priceTryCents,
    };
  }

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
      ip: buyerIp,
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
    throw new Error("Ödeme sayfası alınamadı.");
  }

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

/** @deprecated Prefer finalizeIyzicoPaymentLocked — kept as thin wrapper for call sites. */
export async function finalizePaidPayment(params: {
  serviceClient: SupabaseClient;
  paymentId: string;
  providerPaymentId: string | null;
  raw: Record<string, unknown>;
}): Promise<{ enrollmentId: string; studentUserId: string; alreadyPaid: boolean; recovered?: boolean }> {
  const result = await finalizeIyzicoPaymentLocked(params.serviceClient, {
    paymentId: params.paymentId,
    providerPaymentId: params.providerPaymentId,
    raw: params.raw,
  });
  return {
    enrollmentId: result.enrollmentId,
    studentUserId: result.studentUserId,
    alreadyPaid: result.alreadyPaid,
    recovered: result.recovered,
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
