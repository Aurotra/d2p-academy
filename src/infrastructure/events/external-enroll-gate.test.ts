import { describe, expect, it, vi } from "vitest";

import {
  requiresIyzicoCheckout,
  resolveEventPaymentMode,
} from "@/infrastructure/events/event-payment-mode";

/**
 * Simulates parent enroll gate branching: external must take the direct
 * registered path and must not call iyzico checkout helpers.
 */
describe("parent enroll gate for external payment_mode", () => {
  it("does not start iyzico checkout when payment_mode is external", async () => {
    const startPaidEnrollmentCheckout = vi.fn();
    const tryReserveCapacityAndEnroll = vi.fn(async () => ({
      enrollmentId: "enr-1",
      alreadyEnrolled: false,
      revived: false,
      status: "registered",
    }));

    const event = {
      payment_mode: "external",
      is_paid: false,
      price_try_cents: null as number | null,
    };

    const paymentMode = resolveEventPaymentMode({
      paymentMode: event.payment_mode,
      isPaid: event.is_paid,
    });

    if (requiresIyzicoCheckout(paymentMode)) {
      await startPaidEnrollmentCheckout();
    } else {
      await tryReserveCapacityAndEnroll({
        targetStatus: "registered",
      });
    }

    expect(startPaidEnrollmentCheckout).not.toHaveBeenCalled();
    expect(tryReserveCapacityAndEnroll).toHaveBeenCalledWith({
      targetStatus: "registered",
    });
  });

  it("still starts iyzico checkout when payment_mode is iyzico", async () => {
    const startPaidEnrollmentCheckout = vi.fn(async () => ({ ok: true }));
    const tryReserveCapacityAndEnroll = vi.fn();

    const event = {
      payment_mode: "iyzico",
      is_paid: true,
      price_try_cents: 15000,
    };

    const paymentMode = resolveEventPaymentMode({
      paymentMode: event.payment_mode,
      isPaid: event.is_paid,
    });

    if (requiresIyzicoCheckout(paymentMode)) {
      await startPaidEnrollmentCheckout({ priceTryCents: event.price_try_cents });
    } else {
      await tryReserveCapacityAndEnroll();
    }

    expect(startPaidEnrollmentCheckout).toHaveBeenCalledWith({ priceTryCents: 15000 });
    expect(tryReserveCapacityAndEnroll).not.toHaveBeenCalled();
  });

  it("keeps free on direct registered path", async () => {
    const startPaidEnrollmentCheckout = vi.fn();
    const tryReserveCapacityAndEnroll = vi.fn(async () => ({ status: "registered" }));

    const paymentMode = resolveEventPaymentMode({
      paymentMode: "free",
      isPaid: false,
    });

    if (requiresIyzicoCheckout(paymentMode)) {
      await startPaidEnrollmentCheckout();
    } else {
      await tryReserveCapacityAndEnroll();
    }

    expect(startPaidEnrollmentCheckout).not.toHaveBeenCalled();
    expect(tryReserveCapacityAndEnroll).toHaveBeenCalled();
  });
});
