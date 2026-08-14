import { describe, expect, it } from "vitest";

import {
  eventPaymentWriteFields,
  isPaidFromPaymentMode,
  paymentModeFromIsPaid,
  resolveEventPaymentMode,
  resolvePaymentModeForWrite,
} from "@/infrastructure/events/event-payment-mode";

describe("eventPaymentWriteFields (FAZ 2 payment_mode write)", () => {
  it("writes free: is_paid false, null prices", () => {
    expect(
      eventPaymentWriteFields({
        paymentMode: "free",
        priceTryCents: 15000,
        displayPriceTryCents: 20000,
      }),
    ).toEqual({
      is_paid: false,
      payment_mode: "free",
      price_try_cents: null,
      display_price_try_cents: null,
    });
    expect(isPaidFromPaymentMode("free")).toBe(false);
  });

  it("writes iyzico: is_paid true + required price_try_cents", () => {
    expect(
      eventPaymentWriteFields({
        paymentMode: "iyzico",
        priceTryCents: 15000,
        displayPriceTryCents: 999,
      }),
    ).toEqual({
      is_paid: true,
      payment_mode: "iyzico",
      price_try_cents: 15000,
      display_price_try_cents: null,
    });
    expect(paymentModeFromIsPaid(true)).toBe("iyzico");
    expect(isPaidFromPaymentMode("iyzico")).toBe(true);
  });

  it("rejects iyzico without positive price", () => {
    expect(() =>
      eventPaymentWriteFields({
        paymentMode: "iyzico",
        priceTryCents: null,
      }),
    ).toThrow(/fiyat/i);
    expect(() =>
      eventPaymentWriteFields({
        paymentMode: "iyzico",
        priceTryCents: 0,
      }),
    ).toThrow(/fiyat/i);
  });

  it("writes external: is_paid false, clears checkout price, keeps optional display price", () => {
    expect(
      eventPaymentWriteFields({
        paymentMode: "external",
        priceTryCents: 15000,
        displayPriceTryCents: 25000,
      }),
    ).toEqual({
      is_paid: false,
      payment_mode: "external",
      price_try_cents: null,
      display_price_try_cents: 25000,
    });
    expect(
      eventPaymentWriteFields({
        paymentMode: "external",
      }),
    ).toEqual({
      is_paid: false,
      payment_mode: "external",
      price_try_cents: null,
      display_price_try_cents: null,
    });
    expect(isPaidFromPaymentMode("external")).toBe(false);
  });

  it("resolves legacy isPaid-only clients to free/iyzico", () => {
    expect(resolvePaymentModeForWrite({ isPaid: true })).toBe("iyzico");
    expect(resolvePaymentModeForWrite({ isPaid: false })).toBe("free");
    expect(resolvePaymentModeForWrite({ paymentMode: "external", isPaid: true })).toBe("external");
    expect(resolveEventPaymentMode({ paymentMode: null, isPaid: true })).toBe("iyzico");
    expect(resolveEventPaymentMode({ paymentMode: "external", isPaid: false })).toBe("external");
  });
});
