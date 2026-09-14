import type { SupabaseClient } from "@supabase/supabase-js";

interface RedemptionRpcRow {
  ok?: boolean;
  already_recorded?: boolean;
  redemption_id?: string;
  used_count?: number;
  error_code?: string;
  error_message?: string;
}

/**
 * After a payment is confirmed paid, atomically increment coupon used_count.
 * Idempotent per payment_id. Never call on validate / checkout start.
 */
export async function recordSuccessfulCouponRedemption(
  client: SupabaseClient,
  input: {
    couponId: string;
    paymentId: string | null;
    originalAmountTryCents: number;
    discountAmountTryCents: number;
    finalAmountTryCents: number;
    customerEmail?: string | null;
  },
): Promise<{ alreadyRecorded: boolean; redemptionId: string | null }> {
  const { data, error } = await client.rpc("record_successful_coupon_redemption", {
    p_coupon_id: input.couponId,
    p_payment_id: input.paymentId,
    p_original_amount_try_cents: input.originalAmountTryCents,
    p_discount_amount_try_cents: input.discountAmountTryCents,
    p_final_amount_try_cents: input.finalAmountTryCents,
    p_customer_email: input.customerEmail ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? {}) as RedemptionRpcRow;
  if (!row.ok) {
    throw new Error(row.error_message ?? "Kupon kullanımı kaydedilemedi.");
  }

  return {
    alreadyRecorded: Boolean(row.already_recorded),
    redemptionId: row.redemption_id ?? null,
  };
}

/**
 * Reads coupon snapshot from payments row and records redemption if present.
 * Safe to call on every successful finalize (including alreadyPaid).
 */
export async function recordCouponRedemptionForPayment(
  client: SupabaseClient,
  paymentId: string,
): Promise<void> {
  const { data: payment, error } = await client
    .from("payments")
    .select(
      "id, coupon_id, original_amount_try_cents, discount_try_cents, amount_try_cents, payer_user_id, status",
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!payment?.coupon_id || payment.status !== "paid") {
    return;
  }

  const original =
    payment.original_amount_try_cents ??
    (payment.amount_try_cents ?? 0) + (payment.discount_try_cents ?? 0);
  const discount = payment.discount_try_cents ?? 0;
  const finalAmount = payment.amount_try_cents ?? 0;

  let customerEmail: string | null = null;
  if (payment.payer_user_id) {
    const { data: payer } = await client
      .from("profiles")
      .select("email")
      .eq("id", payment.payer_user_id)
      .maybeSingle();
    customerEmail = payer?.email?.trim() || null;
  }

  try {
    await recordSuccessfulCouponRedemption(client, {
      couponId: payment.coupon_id,
      paymentId: payment.id,
      originalAmountTryCents: original,
      discountAmountTryCents: discount,
      finalAmountTryCents: finalAmount,
      customerEmail,
    });
  } catch (redemptionError) {
    // Payment already succeeded — log and continue; do not fail the callback.
    console.error("[coupon redemption]", redemptionError);
  }
}
