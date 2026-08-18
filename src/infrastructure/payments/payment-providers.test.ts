import { describe, expect, it } from "vitest";

import {
  isCardPaymentProvider,
  isHavalePaymentProvider,
  parseTryLiraToCents,
  resolveHavaleAmountTryCents,
} from "@/infrastructure/payments/payment-providers";

describe("payment providers", () => {
  it("treats legacy empty provider as card checkout", () => {
    expect(isCardPaymentProvider(null)).toBe(true);
    expect(isCardPaymentProvider("")).toBe(true);
    expect(isCardPaymentProvider("paytr")).toBe(true);
    expect(isCardPaymentProvider("iyzico")).toBe(true);
    expect(isCardPaymentProvider("havale")).toBe(false);
  });

  it("recognizes havale without mixing it into card totals", () => {
    expect(isHavalePaymentProvider("havale")).toBe(true);
    expect(isHavalePaymentProvider("HAVALE")).toBe(true);
    expect(isHavalePaymentProvider("paytr")).toBe(false);
  });
});

describe("havale amount", () => {
  it("parses Turkish lira strings to kuruş", () => {
    expect(parseTryLiraToCents("150")).toBe(15000);
    expect(parseTryLiraToCents("150,50")).toBe(15050);
    expect(parseTryLiraToCents("0")).toBeNull();
    expect(parseTryLiraToCents("")).toBeNull();
  });

  it("prefers an override, then the event price", () => {
    expect(
      resolveHavaleAmountTryCents({
        overrideTryCents: 12000,
        eventPriceTryCents: 15000,
      }),
    ).toBe(12000);
    expect(
      resolveHavaleAmountTryCents({
        overrideTryCents: null,
        eventPriceTryCents: 15000,
      }),
    ).toBe(15000);
  });

  it("rejects havale without a usable amount", () => {
    expect(() =>
      resolveHavaleAmountTryCents({
        overrideTryCents: null,
        eventPriceTryCents: null,
      }),
    ).toThrow(/Havale tutarı/);
  });
});
