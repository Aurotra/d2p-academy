import { describe, expect, it } from "vitest";

import {
  eventPaymentWriteFields,
  isPaidFromPaymentMode,
  paymentModeFromIsPaid,
} from "@/infrastructure/events/event-payment-mode";

describe("eventPaymentWriteFields (FAZ 1 is_paid ↔ payment_mode)", () => {
  it("writes iyzico + is_paid true together for paid events", () => {
    expect(eventPaymentWriteFields(true)).toEqual({
      is_paid: true,
      payment_mode: "iyzico",
    });
    expect(paymentModeFromIsPaid(true)).toBe("iyzico");
    expect(isPaidFromPaymentMode("iyzico")).toBe(true);
  });

  it("writes free + is_paid false together for unpaid events", () => {
    expect(eventPaymentWriteFields(false)).toEqual({
      is_paid: false,
      payment_mode: "free",
    });
    expect(paymentModeFromIsPaid(false)).toBe("free");
    expect(isPaidFromPaymentMode("free")).toBe(false);
    expect(isPaidFromPaymentMode("external")).toBe(false);
  });
});
