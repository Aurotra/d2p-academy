import { describe, expect, it } from "vitest";

import {
  isTimestampInRange,
  istanbulWallTimeToUtc,
  paymentTimestampInRange,
  previousEqualRange,
  reportBucketKind,
  resolveAdminReportRange,
} from "@/infrastructure/reports/admin-report-period";

describe("resolveAdminReportRange (Europe/Istanbul)", () => {
  const now = istanbulWallTimeToUtc(2026, 8, 14, 12, 0, 0);

  it("this_month starts at Istanbul 1 Aug 00:00 and ends at next Istanbul day", () => {
    const range = resolveAdminReportRange({ preset: "this_month", now });
    expect(range.startInclusive.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-08-14T21:00:00.000Z");
    expect(isTimestampInRange("2026-07-31T20:59:59.000Z", range)).toBe(false);
    expect(isTimestampInRange("2026-07-31T21:00:00.000Z", range)).toBe(true);
    expect(isTimestampInRange("2026-08-14T20:59:59.000Z", range)).toBe(true);
    expect(isTimestampInRange("2026-08-14T21:00:00.000Z", range)).toBe(false);
  });

  it("last_3_months is rolling from the same Istanbul calendar day", () => {
    const range = resolveAdminReportRange({ preset: "last_3_months", now });
    expect(range.startInclusive.toISOString()).toBe("2026-05-13T21:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-08-14T21:00:00.000Z");
    expect(reportBucketKind(range)).toBe("week");
  });

  it("last_12_months uses monthly buckets", () => {
    const range = resolveAdminReportRange({ preset: "last_12_months", now });
    expect(range.startInclusive.toISOString()).toBe("2025-08-13T21:00:00.000Z");
    expect(reportBucketKind(range)).toBe("month");
  });

  it("custom range is inclusive of both Istanbul calendar days", () => {
    const range = resolveAdminReportRange({
      preset: "custom",
      from: "2026-08-01",
      to: "2026-08-02",
      now,
    });
    expect(range.startInclusive.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-08-02T21:00:00.000Z");
    expect(isTimestampInRange("2026-08-02T20:59:59.000Z", range)).toBe(true);
    expect(isTimestampInRange("2026-08-02T21:00:00.000Z", range)).toBe(false);
  });

  it("paid_at wins over created_at when classifying payment period", () => {
    const range = resolveAdminReportRange({
      preset: "custom",
      from: "2026-08-10",
      to: "2026-08-10",
      now,
    });
    expect(paymentTimestampInRange("2026-08-10T10:00:00.000Z", "2026-07-01T00:00:00.000Z", range)).toBe(
      true,
    );
    expect(paymentTimestampInRange("2026-07-01T00:00:00.000Z", "2026-08-10T10:00:00.000Z", range)).toBe(
      false,
    );
  });

  it("previousEqualRange is the immediately preceding window of the same length", () => {
    const range = resolveAdminReportRange({
      preset: "custom",
      from: "2026-08-08",
      to: "2026-08-14",
      now,
    });
    const previous = previousEqualRange(range);
    expect(previous.endExclusive.toISOString()).toBe(range.startInclusive.toISOString());
    expect(previous.endExclusive.getTime() - previous.startInclusive.getTime()).toBe(
      range.endExclusive.getTime() - range.startInclusive.getTime(),
    );
  });
});
