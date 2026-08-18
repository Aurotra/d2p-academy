import { describe, expect, it } from "vitest";

import {
  buildEventEnrollmentFinanceSummary,
  formatCapacityOccupancy,
  formatCollectionMetric,
} from "@/infrastructure/enrollments/event-enrollment-finance-summary";

describe("buildEventEnrollmentFinanceSummary", () => {
  it("aggregates mixed enrollment/payment/refund states for an iyzico event", () => {
    const summary = buildEventEnrollmentFinanceSummary({
      paymentMode: "iyzico",
      isPaid: true,
      maxCapacity: 20,
      paidAmountTryCents: [15000, 15000, 9900],
      enrollmentStatuses: [
        "registered",
        "attended",
        "completed",
        "pending_payment",
        "pending_payment",
        "cancelled",
        "no_show",
      ],
      openRefundFollowupCount: 1,
    });

    expect(summary.paymentMode).toBe("iyzico");
    expect(summary.totalCollectedTryCents).toBe(39900);
    expect(summary.confirmedSeatCount).toBe(3);
    expect(summary.pendingPaymentCount).toBe(2);
    // 078 hold = pending_payment + registered + attended + completed
    expect(summary.capacityHoldCount).toBe(5);
    expect(summary.maxCapacity).toBe(20);
    expect(summary.openRefundFollowupCount).toBe(1);

    expect(formatCollectionMetric(summary).value).toContain("399");
    expect(formatCollectionMetric(summary).hint).toMatch(/havale/i);
    expect(formatCapacityOccupancy(summary)).toEqual({
      label: "%25",
      detail: "5 / 20",
    });
  });

  it("does not show misleading 0 TL for free/external modes", () => {
    const free = buildEventEnrollmentFinanceSummary({
      paymentMode: "free",
      isPaid: false,
      maxCapacity: null,
      paidAmountTryCents: [],
      enrollmentStatuses: ["registered", "registered"],
      openRefundFollowupCount: 0,
    });
    expect(formatCollectionMetric(free).value).toBe("Ücretsiz etkinlik");
    expect(formatCapacityOccupancy(free).label).toBe("Sınırsız");

    const external = buildEventEnrollmentFinanceSummary({
      paymentMode: "external",
      isPaid: false,
      maxCapacity: 10,
      paidAmountTryCents: [],
      enrollmentStatuses: ["registered"],
      openRefundFollowupCount: 0,
    });
    expect(formatCollectionMetric(external).value).toBe("Kurumsal tahsilat");
    expect(formatCollectionMetric(external).hint).toMatch(/kurum/i);
  });

  it("falls back to is_paid when payment_mode is missing", () => {
    const summary = buildEventEnrollmentFinanceSummary({
      paymentMode: null,
      isPaid: true,
      maxCapacity: 5,
      paidAmountTryCents: [1000],
      enrollmentStatuses: ["registered"],
      openRefundFollowupCount: 0,
    });
    expect(summary.paymentMode).toBe("iyzico");
    expect(summary.totalCollectedTryCents).toBe(1000);
  });
});
