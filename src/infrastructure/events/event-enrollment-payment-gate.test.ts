import { describe, expect, it } from "vitest";

import {
  eventEnrollCtaLabel,
  eventPublicPriceTryCents,
  requiresIyzicoCheckout,
  resolveEventPaymentMode,
} from "@/infrastructure/events/event-payment-mode";

describe("enrollment payment gate (FAZ 2 read)", () => {
  it("free and external enroll directly (no iyzico); only iyzico requires checkout", () => {
    expect(requiresIyzicoCheckout("free")).toBe(false);
    expect(requiresIyzicoCheckout("external")).toBe(false);
    expect(requiresIyzicoCheckout("iyzico")).toBe(true);
  });

  it("external resolves from payment_mode even when legacy is_paid is false", () => {
    expect(
      resolveEventPaymentMode({ paymentMode: "external", isPaid: false }),
    ).toBe("external");
    expect(requiresIyzicoCheckout("external")).toBe(false);
  });

  it("iyzico CTA stays payment-oriented; external CTA does not", () => {
    expect(eventEnrollCtaLabel("free")).toBe("Etkinliğe Kaydol");
    expect(eventEnrollCtaLabel("iyzico")).toBe("Ücretli Kayıt");
    expect(eventEnrollCtaLabel("external")).toBe("Kayıt Ol");
    expect(eventEnrollCtaLabel("external")).not.toMatch(/ödeme/i);
  });

  it("public/SEO price uses checkout price for iyzico and display price for external", () => {
    expect(
      eventPublicPriceTryCents({
        paymentMode: "iyzico",
        priceTryCents: 15000,
        displayPriceTryCents: 999,
      }),
    ).toBe(15000);

    expect(
      eventPublicPriceTryCents({
        paymentMode: "external",
        priceTryCents: null,
        displayPriceTryCents: 25000,
      }),
    ).toBe(25000);

    expect(
      eventPublicPriceTryCents({
        paymentMode: "external",
        priceTryCents: null,
        displayPriceTryCents: null,
      }),
    ).toBeNull();

    expect(
      eventPublicPriceTryCents({
        paymentMode: "free",
        priceTryCents: 15000,
        displayPriceTryCents: 15000,
      }),
    ).toBeNull();
  });
});
