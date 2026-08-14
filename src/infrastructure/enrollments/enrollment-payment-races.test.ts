import { describe, expect, it, vi } from "vitest";

import {
  CapacityFullError,
  tryReserveCapacityAndEnroll,
} from "@/infrastructure/enrollments/try-reserve-capacity-and-enroll";
import {
  cancelStalePendingPaymentLocked,
  finalizeIyzicoPaymentLocked,
} from "@/infrastructure/payments/finalize-iyzico-payment-locked";

function mockClient(rpcImpl: (fn: string, args: Record<string, unknown>) => Promise<unknown>) {
  return {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      try {
        const data = await rpcImpl(fn, args);
        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: error instanceof Error ? error.message : "rpc error" },
        };
      }
    }),
  } as never;
}

describe("tryReserveCapacityAndEnroll", () => {
  it("maps CAPACITY_FULL to CapacityFullError with original message", async () => {
    const client = mockClient(async () => ({
      ok: false,
      error_code: "CAPACITY_FULL",
      error_message: "Bu etkinliğin kontenjanı dolu (20 kişi).",
    }));

    await expect(
      tryReserveCapacityAndEnroll(client, {
        eventId: "11111111-1111-1111-1111-111111111111",
        userId: "22222222-2222-2222-2222-222222222222",
        targetStatus: "registered",
        enrollmentSource: "parent",
      }),
    ).rejects.toBeInstanceOf(CapacityFullError);

    await expect(
      tryReserveCapacityAndEnroll(client, {
        eventId: "11111111-1111-1111-1111-111111111111",
        userId: "22222222-2222-2222-2222-222222222222",
        targetStatus: "registered",
        enrollmentSource: "parent",
      }),
    ).rejects.toThrow("Bu etkinliğin kontenjanı dolu (20 kişi).");
  });

  it("returns enrollment when reserve succeeds", async () => {
    const client = mockClient(async () => ({
      ok: true,
      enrollment_id: "33333333-3333-3333-3333-333333333333",
      already_enrolled: false,
      revived: false,
      status: "pending_payment",
    }));

    const result = await tryReserveCapacityAndEnroll(client, {
      eventId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      targetStatus: "pending_payment",
      enrollmentSource: "parent",
    });

    expect(result).toEqual({
      enrollmentId: "33333333-3333-3333-3333-333333333333",
      alreadyEnrolled: false,
      revived: false,
      status: "pending_payment",
    });
  });
});

describe("finalizeIyzicoPaymentLocked recovery", () => {
  it("flags recovered when previous payment was cancelled", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = mockClient(async () => ({
      ok: true,
      already_paid: false,
      recovered: true,
      enrollment_id: "e1",
      student_user_id: "s1",
      previous_payment_status: "cancelled",
    }));

    const result = await finalizeIyzicoPaymentLocked(client, {
      paymentId: "p1",
      providerPaymentId: "iy-99",
      raw: { paymentStatus: "SUCCESS" },
    });

    expect(result.recovered).toBe(true);
    expect(result.alreadyPaid).toBe(false);
    expect(result.previousPaymentStatus).toBe("cancelled");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[iyzico payment recovered]"),
      expect.objectContaining({ paymentId: "p1", previousPaymentStatus: "cancelled" }),
    );
    errorSpy.mockRestore();
  });

  it("is idempotent when already paid", async () => {
    const client = mockClient(async () => ({
      ok: true,
      already_paid: true,
      recovered: false,
      enrollment_id: "e1",
      student_user_id: "s1",
    }));

    const result = await finalizeIyzicoPaymentLocked(client, {
      paymentId: "p1",
      providerPaymentId: "iy-99",
      raw: {},
    });

    expect(result.alreadyPaid).toBe(true);
    expect(result.recovered).toBe(false);
  });

  it("second identical callback is a pure alreadyPaid no-op (no recovery log)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let paymentStatus: "pending" | "paid" = "pending";
    let finalizeWrites = 0;

    const client = mockClient(async (fn) => {
      expect(fn).toBe("finalize_iyzico_payment");
      if (paymentStatus === "paid") {
        return {
          ok: true,
          already_paid: true,
          recovered: false,
          enrollment_id: "e1",
          student_user_id: "s1",
        };
      }
      finalizeWrites += 1;
      paymentStatus = "paid";
      return {
        ok: true,
        already_paid: false,
        recovered: false,
        enrollment_id: "e1",
        student_user_id: "s1",
        previous_payment_status: "pending",
      };
    });

    const payload = {
      paymentId: "p1",
      providerPaymentId: "iy-99",
      raw: { paymentStatus: "SUCCESS", conversationId: "p1" },
    };

    const first = await finalizeIyzicoPaymentLocked(client, payload);
    const second = await finalizeIyzicoPaymentLocked(client, payload);

    expect(first).toMatchObject({
      alreadyPaid: false,
      recovered: false,
      enrollmentId: "e1",
      studentUserId: "s1",
    });
    expect(second).toMatchObject({
      alreadyPaid: true,
      recovered: false,
      enrollmentId: "e1",
      studentUserId: "s1",
    });
    expect(finalizeWrites).toBe(1);
    expect(paymentStatus).toBe("paid");
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("maps provider_payment_id unique conflict to alreadyPaid when row is paid", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: 'duplicate key value violates unique constraint "payments_provider_payment_id_uidx"' },
      })),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "p1",
                status: "paid",
                enrollment_id: "e1",
                student_user_id: "s1",
              },
              error: null,
            })),
          })),
        })),
      })),
    } as never;

    const result = await finalizeIyzicoPaymentLocked(client, {
      paymentId: "p1",
      providerPaymentId: "iy-99",
      raw: {},
    });

    expect(result).toEqual({
      enrollmentId: "e1",
      studentUserId: "s1",
      alreadyPaid: true,
      recovered: false,
    });
  });
});

describe("cancelStalePendingPaymentLocked", () => {
  it("skips when payment is no longer pending (paid won the race)", async () => {
    const client = mockClient(async () => ({
      ok: true,
      skipped: true,
      reason: "not_pending",
      payment_status: "paid",
    }));

    const result = await cancelStalePendingPaymentLocked(client, "p1");
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("not_pending");
  });
});

/**
 * Manual / DB race scenarios (run against Supabase after migration 078):
 *
 * CAPACITY:
 * 1) Set event max_capacity = N with N seats already holding.
 * 2) Open two SQL sessions:
 *    SESSION A: begin; select reserve_event_enrollment(event, user_a, 'registered');
 *    SESSION B: begin; select reserve_event_enrollment(event, user_b, 'registered');
 * 3) Commit A then B (or run concurrently via two API POSTs).
 * 4) Expect exactly one ok:true insert and one CAPACITY_FULL — never N+1 holds.
 *
 * STALE × CALLBACK:
 * 1) Create payment pending + enrollment pending_payment.
 * 2) SESSION A: begin; select cancel_stale_pending_payment(payment_id); — holds lock.
 * 3) SESSION B: select finalize_iyzico_payment(payment_id, 'x', '{}'::jsonb); — blocks on FOR UPDATE.
 * 4a) If A commits cancel first, B recovers: payment=paid, enrollment=registered, recovered=true.
 * 4b) If B finalizes first (paid), A skip not_pending — payment stays paid, enrollment registered.
 * Never leave payment=cancelled with enrollment=registered without recovery path setting paid.
 */
describe("race scenario documentation", () => {
  it("documents expected invariants", () => {
    const invariants = [
      "capacity holds never exceed max_capacity under concurrent reserve_event_enrollment",
      "finalize after cancel recovers to paid+registered (never cancelled+registered)",
      "cancel after paid is a no-op (skipped not_pending)",
    ];
    expect(invariants).toHaveLength(3);
  });
});
