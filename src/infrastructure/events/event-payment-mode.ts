/**
 * Event payment mode helpers (FAZ 2 write path).
 * Readers may still use is_paid until CTA/enroll migration.
 */

import type { EventPaymentMode } from "@/core/domain/admin-event";

export type { EventPaymentMode };

export function paymentModeFromIsPaid(isPaid: boolean): Exclude<EventPaymentMode, "external"> {
  return isPaid ? "iyzico" : "free";
}

export function isPaidFromPaymentMode(mode: EventPaymentMode): boolean {
  return mode === "iyzico";
}

export function resolveEventPaymentMode(input: {
  paymentMode?: string | null;
  isPaid?: boolean | null;
}): EventPaymentMode {
  if (
    input.paymentMode === "free" ||
    input.paymentMode === "iyzico" ||
    input.paymentMode === "external"
  ) {
    return input.paymentMode;
  }
  return paymentModeFromIsPaid(Boolean(input.isPaid));
}

export type EventPaymentWriteFields = {
  is_paid: boolean;
  payment_mode: EventPaymentMode;
  price_try_cents: number | null;
  display_price_try_cents: number | null;
};

/**
 * DB columns written together on admin create/update.
 * is_paid mirrors payment_mode === 'iyzico' (DB trigger also enforces this).
 */
export function eventPaymentWriteFields(input: {
  paymentMode: EventPaymentMode;
  priceTryCents?: number | null;
  displayPriceTryCents?: number | null;
}): EventPaymentWriteFields {
  const mode = input.paymentMode;

  if (mode === "iyzico") {
    const price = input.priceTryCents ?? null;
    if (price == null || price <= 0) {
      throw new Error("iyzico ödemeli etkinlik için geçerli bir fiyat girin (ör. 150).");
    }
    return {
      is_paid: true,
      payment_mode: "iyzico",
      price_try_cents: price,
      display_price_try_cents: null,
    };
  }

  if (mode === "external") {
    const display = input.displayPriceTryCents ?? null;
    if (display != null && display < 0) {
      throw new Error("Gösterim fiyatı negatif olamaz.");
    }
    return {
      is_paid: false,
      payment_mode: "external",
      price_try_cents: null,
      display_price_try_cents: display != null && display > 0 ? display : null,
    };
  }

  return {
    is_paid: false,
    payment_mode: "free",
    price_try_cents: null,
    display_price_try_cents: null,
  };
}

/** Resolve write input when older clients still send isPaid without paymentMode. */
export function resolvePaymentModeForWrite(input: {
  paymentMode?: EventPaymentMode | null;
  isPaid?: boolean | null;
}): EventPaymentMode {
  if (input.paymentMode) {
    return input.paymentMode;
  }
  return paymentModeFromIsPaid(Boolean(input.isPaid));
}
