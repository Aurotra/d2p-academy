/**
 * FAZ 1 helpers: keep events.is_paid and events.payment_mode consistent on write.
 * Readers still use is_paid until FAZ 2.
 */

export type EventPaymentMode = "free" | "iyzico" | "external";

export function paymentModeFromIsPaid(isPaid: boolean): Exclude<EventPaymentMode, "external"> {
  return isPaid ? "iyzico" : "free";
}

export function isPaidFromPaymentMode(mode: EventPaymentMode): boolean {
  return mode === "iyzico";
}

/** DB columns written together on admin create/update (FAZ 1). */
export function eventPaymentWriteFields(isPaid: boolean): {
  is_paid: boolean;
  payment_mode: Exclude<EventPaymentMode, "external">;
} {
  const payment_mode = paymentModeFromIsPaid(isPaid);
  return {
    is_paid: isPaidFromPaymentMode(payment_mode),
    payment_mode,
  };
}
