import { CONFIRMED_SEAT_STATUSES } from "@/infrastructure/enrollments/event-enrollment-finance-summary";
import { resolveEventPaymentMode } from "@/infrastructure/events/event-payment-mode";
import {
  bucketKeyForTimestamp,
  enumerateBucketKeys,
  formatBucketLabel,
  isTimestampInRange,
  paymentTimestampInRange,
  previousEqualRange,
  reportBucketKind,
  type AdminReportBucketKind,
  type AdminReportRange,
} from "@/infrastructure/reports/admin-report-period";

export const REPORT_ENROLLMENT_SOURCES = [
  "parent",
  "admin_manual",
  "self",
  "unknown_legacy",
] as const;

export type ReportEnrollmentSource = (typeof REPORT_ENROLLMENT_SOURCES)[number];

export const REPORT_ENROLLMENT_SOURCE_LABELS: Record<ReportEnrollmentSource, string> = {
  parent: "Veli",
  admin_manual: "Admin",
  self: "Öğrenci",
  unknown_legacy: "Diğer (eski)",
};

export type AdminReportEnrollmentRow = {
  eventId: string;
  status: string;
  enrollmentSource: string | null;
  registeredAt: string;
};

export type AdminReportPaymentRow = {
  amountTryCents: number;
  paidAt: string | null;
  createdAt: string;
};

export type AdminReportEventRow = {
  id: string;
  title: string;
  paymentMode: string | null;
  isPaid: boolean | null;
  displayPriceTryCents: number | null;
};

export type PopularEventRow = {
  eventId: string;
  title: string;
  confirmedSeatCount: number;
};

export type SourceBucket = {
  key: string;
  label: string;
  parent: number;
  admin_manual: number;
  self: number;
  unknown_legacy: number;
  total: number;
};

export type AdminReportOverview = {
  range: AdminReportRange;
  iyzicoCollectedTryCents: number;
  previousIyzicoCollectedTryCents: number;
  iyzicoTrendPct: number | null;
  externalEstimateTryCents: number;
  enrollmentCount: number;
  cancelledCount: number;
  cancelRatePct: number | null;
  hardDeletedCount: number;
  openRefundFollowupCount: number;
  popularEvents: PopularEventRow[];
};

export type AdminReportSourceTrend = {
  bucketKind: AdminReportBucketKind;
  buckets: SourceBucket[];
  totals: Record<ReportEnrollmentSource, number> & { total: number };
};

function normalizeSource(value: string | null | undefined): ReportEnrollmentSource {
  if (
    value === "parent" ||
    value === "admin_manual" ||
    value === "self" ||
    value === "unknown_legacy"
  ) {
    return value;
  }
  return "unknown_legacy";
}

function sumPaidInRange(payments: AdminReportPaymentRow[], range: AdminReportRange): number {
  return payments.reduce((sum, payment) => {
    if (!paymentTimestampInRange(payment.paidAt, payment.createdAt, range)) {
      return sum;
    }
    const cents = Number(payment.amountTryCents);
    return sum + (Number.isFinite(cents) ? cents : 0);
  }, 0);
}

export function filterEnrollmentsInRange(
  enrollments: AdminReportEnrollmentRow[],
  range: AdminReportRange,
): AdminReportEnrollmentRow[] {
  return enrollments.filter((row) => isTimestampInRange(row.registeredAt, range));
}

export function buildCancelRate(enrollments: AdminReportEnrollmentRow[]): {
  enrollmentCount: number;
  cancelledCount: number;
  cancelRatePct: number | null;
} {
  const enrollmentCount = enrollments.length;
  const cancelledCount = enrollments.filter((row) => row.status === "cancelled").length;
  return {
    enrollmentCount,
    cancelledCount,
    cancelRatePct:
      enrollmentCount === 0 ? null : Math.round((cancelledCount / enrollmentCount) * 1000) / 10,
  };
}

export function buildExternalEstimateTryCents(
  enrollments: AdminReportEnrollmentRow[],
  eventsById: Map<string, AdminReportEventRow>,
): number {
  const confirmed = new Set<string>(CONFIRMED_SEAT_STATUSES);
  let total = 0;
  for (const row of enrollments) {
    if (!confirmed.has(row.status)) {
      continue;
    }
    const event = eventsById.get(row.eventId);
    if (!event) {
      continue;
    }
    const mode = resolveEventPaymentMode({
      paymentMode: event.paymentMode,
      isPaid: event.isPaid,
    });
    if (mode !== "external") {
      continue;
    }
    const display = event.displayPriceTryCents;
    if (display != null && display > 0) {
      total += display;
    }
  }
  return total;
}

export function buildPopularEvents(
  enrollments: AdminReportEnrollmentRow[],
  eventsById: Map<string, AdminReportEventRow>,
  limit = 10,
): PopularEventRow[] {
  const confirmed = new Set<string>(CONFIRMED_SEAT_STATUSES);
  const counts = new Map<string, number>();
  for (const row of enrollments) {
    if (!confirmed.has(row.status)) {
      continue;
    }
    counts.set(row.eventId, (counts.get(row.eventId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([eventId, confirmedSeatCount]) => ({
      eventId,
      title: eventsById.get(eventId)?.title ?? "Etkinlik",
      confirmedSeatCount,
    }));
}

export function trendPct(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? null : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function buildAdminReportOverview(input: {
  range: AdminReportRange;
  enrollments: AdminReportEnrollmentRow[];
  payments: AdminReportPaymentRow[];
  events: AdminReportEventRow[];
  hardDeletedCount: number;
  openRefundFollowupCount: number;
}): AdminReportOverview {
  const inRange = filterEnrollmentsInRange(input.enrollments, input.range);
  const eventsById = new Map(input.events.map((event) => [event.id, event]));
  const cancel = buildCancelRate(inRange);
  const previousRange = previousEqualRange(input.range);
  const iyzicoCollectedTryCents = sumPaidInRange(input.payments, input.range);
  const previousIyzicoCollectedTryCents = sumPaidInRange(input.payments, previousRange);

  return {
    range: input.range,
    iyzicoCollectedTryCents,
    previousIyzicoCollectedTryCents,
    iyzicoTrendPct: trendPct(iyzicoCollectedTryCents, previousIyzicoCollectedTryCents),
    externalEstimateTryCents: buildExternalEstimateTryCents(inRange, eventsById),
    ...cancel,
    hardDeletedCount: Math.max(0, input.hardDeletedCount),
    openRefundFollowupCount: Math.max(0, input.openRefundFollowupCount),
    popularEvents: buildPopularEvents(inRange, eventsById),
  };
}

export function buildAdminReportSourceTrend(
  enrollments: AdminReportEnrollmentRow[],
  range: AdminReportRange,
): AdminReportSourceTrend {
  const inRange = filterEnrollmentsInRange(enrollments, range);
  const bucketKind = reportBucketKind(range);
  const keys = enumerateBucketKeys(range, bucketKind);
  const counts = new Map<string, Record<ReportEnrollmentSource, number>>();

  for (const key of keys) {
    counts.set(key, { parent: 0, admin_manual: 0, self: 0, unknown_legacy: 0 });
  }

  for (const row of inRange) {
    const key = bucketKeyForTimestamp(row.registeredAt, bucketKind);
    const bucket = counts.get(key) ?? {
      parent: 0,
      admin_manual: 0,
      self: 0,
      unknown_legacy: 0,
    };
    const source = normalizeSource(row.enrollmentSource);
    bucket[source] += 1;
    counts.set(key, bucket);
  }

  const buckets: SourceBucket[] = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      label: formatBucketLabel(key, bucketKind),
      ...value,
      total: value.parent + value.admin_manual + value.self + value.unknown_legacy,
    }));

  const totals = {
    parent: 0,
    admin_manual: 0,
    self: 0,
    unknown_legacy: 0,
    total: 0,
  };
  for (const bucket of buckets) {
    totals.parent += bucket.parent;
    totals.admin_manual += bucket.admin_manual;
    totals.self += bucket.self;
    totals.unknown_legacy += bucket.unknown_legacy;
    totals.total += bucket.total;
  }

  return { bucketKind, buckets, totals };
}
