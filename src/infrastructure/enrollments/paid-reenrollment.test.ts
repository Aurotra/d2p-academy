import { describe, expect, it } from "vitest";

import { resolvePaidCheckoutReserveAction } from "@/infrastructure/enrollments/paid-reenrollment";

describe("resolvePaidCheckoutReserveAction", () => {
  it("lets a fresh or revived cancelled seat continue to payment", () => {
    expect(
      resolvePaidCheckoutReserveAction({
        alreadyEnrolled: false,
        status: "pending_payment",
        hasPaidPayment: false,
      }),
    ).toBe("proceed");
  });

  it("reuses an existing pending_payment seat", () => {
    expect(
      resolvePaidCheckoutReserveAction({
        alreadyEnrolled: true,
        status: "pending_payment",
        hasPaidPayment: false,
      }),
    ).toBe("proceed");
  });

  it("blocks checkout when the student already paid for this event", () => {
    expect(
      resolvePaidCheckoutReserveAction({
        alreadyEnrolled: true,
        status: "registered",
        hasPaidPayment: true,
      }),
    ).toBe("already_enrolled");
  });

  it("converts a leftover free registered seat so they can pay", () => {
    expect(
      resolvePaidCheckoutReserveAction({
        alreadyEnrolled: true,
        status: "registered",
        hasPaidPayment: false,
      }),
    ).toBe("convert_unpaid_to_pending");
  });

  it("converts leftover attended/completed free seats the same way", () => {
    expect(
      resolvePaidCheckoutReserveAction({
        alreadyEnrolled: true,
        status: "attended",
        hasPaidPayment: false,
      }),
    ).toBe("convert_unpaid_to_pending");

    expect(
      resolvePaidCheckoutReserveAction({
        alreadyEnrolled: true,
        status: "completed",
        hasPaidPayment: false,
      }),
    ).toBe("convert_unpaid_to_pending");
  });
});
