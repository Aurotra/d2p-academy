import type { EventPaymentMode } from "@/core/domain/admin-event";
import { formatTryCentsDisplay } from "@/core/domain/payment";

/** Seat statuses that count toward capacity (migration 078 hold definition). */
export const CAPACITY_HOLD_STATUSES = [
  "pending_payment",
  "registered",
  "attended",
  "completed",
] as const;

/** Confirmed seats shown as "kayıtlı" (excludes pending_payment). */
export const CONFIRMED_SEAT_STATUSES = ["registered", "attended", "completed"] as const;

export type EventEnrollmentFinanceSummary = {
  paymentMode: EventPaymentMode;
  totalCollectedTryCents: number;
  confirmedSeatCount: number;
  pendingPaymentCount: number;
  capacityHoldCount: number;
  maxCapacity: number | null;
  openRefundFollowupCount: number;
};

export type EventEnrollmentFinanceSummaryInput = {
  paymentMode: string | null;
  isPaid: boolean | null;
  maxCapacity: number | null;
  paidAmountTryCents: number[];
  enrollmentStatuses: string[];
  openRefundFollowupCount: number;
};

export function resolveEventPaymentMode(input: {
  paymentMode: string | null | undefined;
  isPaid: boolean | null | undefined;
}): EventPaymentMode {
  if (input.paymentMode === "free" || input.paymentMode === "iyzico" || input.paymentMode === "external") {
    return input.paymentMode;
  }
  return input.isPaid ? "iyzico" : "free";
}

export function buildEventEnrollmentFinanceSummary(
  input: EventEnrollmentFinanceSummaryInput,
): EventEnrollmentFinanceSummary {
  const paymentMode = resolveEventPaymentMode({
    paymentMode: input.paymentMode,
    isPaid: input.isPaid,
  });

  const confirmedSeatCount = input.enrollmentStatuses.filter((status) =>
    (CONFIRMED_SEAT_STATUSES as readonly string[]).includes(status),
  ).length;

  const pendingPaymentCount = input.enrollmentStatuses.filter(
    (status) => status === "pending_payment",
  ).length;

  const capacityHoldCount = input.enrollmentStatuses.filter((status) =>
    (CAPACITY_HOLD_STATUSES as readonly string[]).includes(status),
  ).length;

  const totalCollectedTryCents = input.paidAmountTryCents.reduce(
    (sum, cents) => sum + (Number.isFinite(cents) ? cents : 0),
    0,
  );

  return {
    paymentMode,
    totalCollectedTryCents,
    confirmedSeatCount,
    pendingPaymentCount,
    capacityHoldCount,
    maxCapacity: input.maxCapacity != null && input.maxCapacity > 0 ? input.maxCapacity : null,
    openRefundFollowupCount: Math.max(0, input.openRefundFollowupCount),
  };
}

export function formatCapacityOccupancy(summary: EventEnrollmentFinanceSummary): {
  label: string;
  detail: string;
} {
  if (summary.maxCapacity == null) {
    return {
      label: "Sınırsız",
      detail: `${summary.capacityHoldCount} kontenjan tutuluyor`,
    };
  }

  const pct = Math.min(
    100,
    Math.round((summary.capacityHoldCount / summary.maxCapacity) * 100),
  );

  return {
    label: `%${pct}`,
    detail: `${summary.capacityHoldCount} / ${summary.maxCapacity}`,
  };
}

export function formatCollectionMetric(summary: EventEnrollmentFinanceSummary): {
  title: string;
  value: string;
  hint?: string;
} {
  if (summary.paymentMode === "free") {
    return {
      title: "Tahsilat",
      value: "Ücretsiz etkinlik",
      hint: "Platform üzerinden ödeme alınmaz",
    };
  }

  if (summary.paymentMode === "external") {
    return {
      title: "Tahsilat",
      value: "Kurumsal tahsilat",
      hint: "Tahsilat kurum tarafından yapılıyor",
    };
  }

  return {
    title: "Toplam tahsilat",
    value: formatTryCentsDisplay(summary.totalCollectedTryCents),
    hint: "Kart ve havale (paid) toplamı",
  };
}
