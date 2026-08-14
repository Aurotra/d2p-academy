import { describe, expect, it } from "vitest";

import { eventPaymentWriteFields } from "@/infrastructure/events/event-payment-mode";

/**
 * Mirrors admin form → API payload → repository write combinations
 * for free / iyzico / external (FAZ 2 write side).
 */
describe("admin event payment write combinations", () => {
  it("free form save clears both price columns and sets is_paid false", () => {
    const fields = eventPaymentWriteFields({
      paymentMode: "free",
      priceTryCents: null,
      displayPriceTryCents: null,
    });
    expect(fields).toEqual({
      is_paid: false,
      payment_mode: "free",
      price_try_cents: null,
      display_price_try_cents: null,
    });
  });

  it("iyzico form save requires price_try_cents and sets is_paid true", () => {
    const fields = eventPaymentWriteFields({
      paymentMode: "iyzico",
      priceTryCents: 17500,
      displayPriceTryCents: null,
    });
    expect(fields).toEqual({
      is_paid: true,
      payment_mode: "iyzico",
      price_try_cents: 17500,
      display_price_try_cents: null,
    });
  });

  it("external form save nulls checkout price, keeps optional display price, is_paid false", () => {
    const withDisplay = eventPaymentWriteFields({
      paymentMode: "external",
      priceTryCents: null,
      displayPriceTryCents: 30000,
    });
    expect(withDisplay).toEqual({
      is_paid: false,
      payment_mode: "external",
      price_try_cents: null,
      display_price_try_cents: 30000,
    });

    const withoutDisplay = eventPaymentWriteFields({
      paymentMode: "external",
      priceTryCents: null,
      displayPriceTryCents: null,
    });
    expect(withoutDisplay).toEqual({
      is_paid: false,
      payment_mode: "external",
      price_try_cents: null,
      display_price_try_cents: null,
    });
  });
});
