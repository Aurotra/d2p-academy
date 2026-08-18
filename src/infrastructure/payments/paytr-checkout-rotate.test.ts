import { describe, expect, it } from "vitest";

import { shouldRotatePaytrCheckout } from "@/infrastructure/payments/paytr-session";

describe("shouldRotatePaytrCheckout", () => {
  it("keeps a fresh pending PayTR iframe", () => {
    expect(
      shouldRotatePaytrCheckout({
        status: "pending",
        provider: "paytr",
        createdAt: new Date().toISOString(),
        isFreshLoad: true,
      }),
    ).toBe(false);
  });

  it("rotates when the same pending URL is opened again", () => {
    expect(
      shouldRotatePaytrCheckout({
        status: "pending",
        provider: "paytr",
        createdAt: new Date().toISOString(),
        isFreshLoad: false,
      }),
    ).toBe(true);
  });

  it("rotates a stale token even on a fresh load", () => {
    expect(
      shouldRotatePaytrCheckout({
        status: "pending",
        provider: "paytr",
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        isFreshLoad: true,
      }),
    ).toBe(true);
  });

  it("does not rotate paid rows", () => {
    expect(
      shouldRotatePaytrCheckout({
        status: "paid",
        provider: "paytr",
        createdAt: new Date().toISOString(),
        isFreshLoad: false,
      }),
    ).toBe(false);
  });
});
