import { describe, expect, it } from "vitest";

import {
  classifyAdminPaymentMethod,
  isStuckCardPayment,
  resolvePaymentProviderRef,
  resolveStuckCardSweepAction,
  stuckCardReleasePlan,
  STALE_CARD_CHECKOUT_TTL_MS,
  STUCK_CARD_RELEASE_AFTER_MS,
  STUCK_CARD_WARN_AFTER_MS,
  whatsappHref,
} from "@/infrastructure/payments/admin-payment-ledger";

describe("classifyAdminPaymentMethod", () => {
  it("maps providers onto ledger methods", () => {
    expect(classifyAdminPaymentMethod({ provider: "paytr" })).toBe("card");
    expect(classifyAdminPaymentMethod({ provider: "iyzico" })).toBe("card");
    expect(classifyAdminPaymentMethod({ provider: null })).toBe("card");
    expect(classifyAdminPaymentMethod({ provider: "havale" })).toBe("havale");
    expect(
      classifyAdminPaymentMethod({ kind: "kurum_enrollment", eventPaymentMode: "external" }),
    ).toBe("kurum");
  });
});

describe("isStuckCardPayment", () => {
  const createdAt = "2026-08-18T12:00:00.000Z";
  const nowMs = Date.parse("2026-08-18T12:50:00.000Z");

  it("flags stale pending card checkouts that still hold a seat", () => {
    expect(
      isStuckCardPayment({
        method: "card",
        paymentStatus: "pending",
        enrollmentStatus: "pending_payment",
        createdAt,
        nowMs,
      }),
    ).toBe(true);
    expect(nowMs - Date.parse(createdAt)).toBeGreaterThan(STALE_CARD_CHECKOUT_TTL_MS);
  });

  it("flags failed card payments while the seat is still held", () => {
    expect(
      isStuckCardPayment({
        method: "card",
        paymentStatus: "failed",
        enrollmentStatus: "pending_payment",
        createdAt,
        nowMs: Date.parse("2026-08-18T12:01:00.000Z"),
      }),
    ).toBe(true);
  });

  it("does not flag fresh pending, paid, havale, or registered seats", () => {
    expect(
      isStuckCardPayment({
        method: "card",
        paymentStatus: "pending",
        enrollmentStatus: "pending_payment",
        createdAt,
        nowMs: Date.parse("2026-08-18T12:10:00.000Z"),
      }),
    ).toBe(false);
    expect(
      isStuckCardPayment({
        method: "card",
        paymentStatus: "paid",
        enrollmentStatus: "registered",
        createdAt,
        nowMs,
      }),
    ).toBe(false);
    expect(
      isStuckCardPayment({
        method: "havale",
        paymentStatus: "pending",
        enrollmentStatus: "pending_payment",
        createdAt,
        nowMs,
      }),
    ).toBe(false);
  });
});

describe("stuckCardReleasePlan", () => {
  it("cancels pending payment and seat together", () => {
    expect(
      stuckCardReleasePlan({
        paymentStatus: "pending",
        enrollmentStatus: "pending_payment",
        isStuck: true,
      }),
    ).toBe("cancel_pending_and_seat");
  });

  it("only cancels the seat when the card attempt already failed", () => {
    expect(
      stuckCardReleasePlan({
        paymentStatus: "failed",
        enrollmentStatus: "pending_payment",
        isStuck: true,
      }),
    ).toBe("cancel_seat_only");
  });
});

describe("resolvePaymentProviderRef", () => {
  it("prefers dekont for havale and merchant oid for card", () => {
    expect(
      resolvePaymentProviderRef({
        provider: "havale",
        providerPaymentId: "DK-12",
        providerConversationId: "oid",
      }),
    ).toBe("DK-12");
    expect(
      resolvePaymentProviderRef({
        provider: "paytr",
        providerPaymentId: "pid",
        providerConversationId: "oid-99",
      }),
    ).toBe("oid-99");
  });
});

describe("resolveStuckCardSweepAction", () => {
  const createdAt = "2026-08-18T12:00:00.000Z";
  const createdMs = Date.parse(createdAt);

  it("does nothing before the 2 hour warning window", () => {
    expect(
      resolveStuckCardSweepAction({
        isStuck: true,
        createdAt,
        nowMs: createdMs + STUCK_CARD_WARN_AFTER_MS - 1,
      }),
    ).toBe("none");
  });

  it("warns once after 2 hours", () => {
    expect(
      resolveStuckCardSweepAction({
        isStuck: true,
        createdAt,
        nowMs: createdMs + STUCK_CARD_WARN_AFTER_MS,
      }),
    ).toBe("warn");
    expect(
      resolveStuckCardSweepAction({
        isStuck: true,
        createdAt,
        warnedAt: "2026-08-18T14:00:00.000Z",
        nowMs: createdMs + STUCK_CARD_WARN_AFTER_MS + 30 * 60 * 1000,
      }),
    ).toBe("none");
  });

  it("releases after 3 hours even if the warning was skipped", () => {
    expect(
      resolveStuckCardSweepAction({
        isStuck: true,
        createdAt,
        nowMs: createdMs + STUCK_CARD_RELEASE_AFTER_MS,
      }),
    ).toBe("release");
    expect(
      resolveStuckCardSweepAction({
        isStuck: true,
        createdAt,
        warnedAt: "2026-08-18T14:00:00.000Z",
        nowMs: createdMs + STUCK_CARD_RELEASE_AFTER_MS,
      }),
    ).toBe("release");
  });

  it("skips paid or already released seats", () => {
    expect(
      resolveStuckCardSweepAction({
        isStuck: false,
        createdAt,
        nowMs: createdMs + STUCK_CARD_RELEASE_AFTER_MS,
      }),
    ).toBe("none");
    expect(
      resolveStuckCardSweepAction({
        isStuck: true,
        createdAt,
        releasedAt: "2026-08-18T15:00:00.000Z",
        nowMs: createdMs + STUCK_CARD_RELEASE_AFTER_MS,
      }),
    ).toBe("none");
  });
});

describe("whatsappHref", () => {
  it("normalizes TR mobiles", () => {
    expect(whatsappHref("0555 111 22 33")).toBe("https://wa.me/905551112233");
    expect(whatsappHref("90 555 111 22 33")).toBe("https://wa.me/905551112233");
    expect(whatsappHref("12")).toBeNull();
  });
});
