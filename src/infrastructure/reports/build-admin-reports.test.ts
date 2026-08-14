import { describe, expect, it } from "vitest";

import { istanbulWallTimeToUtc, resolveAdminReportRange } from "@/infrastructure/reports/admin-report-period";
import {
  buildAdminReportOverview,
  buildAdminReportSourceTrend,
  buildCancelRate,
} from "@/infrastructure/reports/build-admin-reports";

const now = istanbulWallTimeToUtc(2026, 8, 14, 12, 0, 0);
const range = resolveAdminReportRange({
  preset: "custom",
  from: "2026-08-01",
  to: "2026-08-14",
  now,
});

describe("buildAdminReportOverview", () => {
  it("sums only paid iyzico amounts in range and keeps external estimate separate", () => {
    const overview = buildAdminReportOverview({
      range,
      hardDeletedCount: 2,
      openRefundFollowupCount: 3,
      events: [
        {
          id: "evt-iyzico",
          title: "Kartlı kamp",
          paymentMode: "iyzico",
          isPaid: true,
          displayPriceTryCents: 999,
        },
        {
          id: "evt-ext",
          title: "Kurum kampı",
          paymentMode: "external",
          isPaid: false,
          displayPriceTryCents: 25000,
        },
        {
          id: "evt-free",
          title: "Ücretsiz",
          paymentMode: "free",
          isPaid: false,
          displayPriceTryCents: null,
        },
      ],
      payments: [
        { amountTryCents: 15000, paidAt: "2026-08-05T10:00:00.000Z", createdAt: "2026-08-05T09:00:00.000Z" },
        { amountTryCents: 15000, paidAt: "2026-07-01T10:00:00.000Z", createdAt: "2026-07-01T09:00:00.000Z" },
        { amountTryCents: 8000, paidAt: "2026-08-12T10:00:00.000Z", createdAt: "2026-08-12T09:00:00.000Z" },
      ],
      enrollments: [
        {
          eventId: "evt-iyzico",
          status: "registered",
          enrollmentSource: "parent",
          registeredAt: "2026-08-05T10:00:00.000Z",
        },
        {
          eventId: "evt-ext",
          status: "registered",
          enrollmentSource: "parent",
          registeredAt: "2026-08-06T10:00:00.000Z",
        },
        {
          eventId: "evt-ext",
          status: "cancelled",
          enrollmentSource: "parent",
          registeredAt: "2026-08-07T10:00:00.000Z",
        },
        {
          eventId: "evt-ext",
          status: "pending_payment",
          enrollmentSource: "parent",
          registeredAt: "2026-08-08T10:00:00.000Z",
        },
        {
          eventId: "evt-free",
          status: "registered",
          enrollmentSource: "self",
          registeredAt: "2026-07-01T10:00:00.000Z",
        },
      ],
    });

    expect(overview.iyzicoCollectedTryCents).toBe(23000);
    expect(overview.externalEstimateTryCents).toBe(25000);
    expect(overview.iyzicoCollectedTryCents + overview.externalEstimateTryCents).not.toBe(
      overview.iyzicoCollectedTryCents,
    );
    expect(overview.enrollmentCount).toBe(4);
    expect(overview.cancelledCount).toBe(1);
    expect(overview.cancelRatePct).toBe(25);
    expect(overview.hardDeletedCount).toBe(2);
    expect(overview.openRefundFollowupCount).toBe(3);
    expect(overview.popularEvents.map((row) => row.eventId).sort()).toEqual([
      "evt-ext",
      "evt-iyzico",
    ]);
    expect(overview.popularEvents.every((row) => row.confirmedSeatCount === 1)).toBe(true);
  });

  it("does not mix cancelled or pending seats into popular-event ranking", () => {
    const overview = buildAdminReportOverview({
      range,
      hardDeletedCount: 0,
      openRefundFollowupCount: 0,
      events: [
        { id: "a", title: "A", paymentMode: "free", isPaid: false, displayPriceTryCents: null },
        { id: "b", title: "B", paymentMode: "free", isPaid: false, displayPriceTryCents: null },
      ],
      payments: [],
      enrollments: [
        { eventId: "a", status: "cancelled", enrollmentSource: "parent", registeredAt: "2026-08-02T10:00:00.000Z" },
        { eventId: "a", status: "cancelled", enrollmentSource: "parent", registeredAt: "2026-08-03T10:00:00.000Z" },
        { eventId: "b", status: "registered", enrollmentSource: "parent", registeredAt: "2026-08-04T10:00:00.000Z" },
      ],
    });
    expect(overview.popularEvents).toEqual([
      { eventId: "b", title: "B", confirmedSeatCount: 1 },
    ]);
  });
});

describe("buildCancelRate", () => {
  it("is cancelled / all period enrollments including pending", () => {
    expect(
      buildCancelRate([
        { eventId: "e", status: "cancelled", enrollmentSource: "parent", registeredAt: "x" },
        { eventId: "e", status: "pending_payment", enrollmentSource: "parent", registeredAt: "x" },
        { eventId: "e", status: "registered", enrollmentSource: "parent", registeredAt: "x" },
        { eventId: "e", status: "no_show", enrollmentSource: "parent", registeredAt: "x" },
      ]),
    ).toEqual({ enrollmentCount: 4, cancelledCount: 1, cancelRatePct: 25 });
  });

  it("returns null rate when the period has no enrollments", () => {
    expect(buildCancelRate([])).toEqual({
      enrollmentCount: 0,
      cancelledCount: 0,
      cancelRatePct: null,
    });
  });
});

describe("buildAdminReportSourceTrend", () => {
  it("counts sources by Istanbul week and keeps unknown_legacy visible", () => {
    const trend = buildAdminReportSourceTrend(
      [
        {
          eventId: "e",
          status: "registered",
          enrollmentSource: "parent",
          registeredAt: "2026-08-03T10:00:00.000Z",
        },
        {
          eventId: "e",
          status: "registered",
          enrollmentSource: "admin_manual",
          registeredAt: "2026-08-04T10:00:00.000Z",
        },
        {
          eventId: "e",
          status: "registered",
          enrollmentSource: "self",
          registeredAt: "2026-08-05T10:00:00.000Z",
        },
        {
          eventId: "e",
          status: "cancelled",
          enrollmentSource: null,
          registeredAt: "2026-08-06T10:00:00.000Z",
        },
      ],
      range,
    );

    expect(trend.totals).toEqual({
      parent: 1,
      admin_manual: 1,
      self: 1,
      unknown_legacy: 1,
      total: 4,
    });
    expect(trend.bucketKind).toBe("week");
    expect(trend.buckets.reduce((sum, bucket) => sum + bucket.total, 0)).toBe(4);
  });
});
