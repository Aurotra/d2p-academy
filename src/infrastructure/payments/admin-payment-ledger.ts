import {
  isCardPaymentProvider,
  isHavalePaymentProvider,
} from "@/infrastructure/payments/payment-providers";
import type { PaymentStatus } from "@/core/domain/payment";

export const STALE_CARD_CHECKOUT_TTL_MS = 45 * 60 * 1000;
export const STUCK_CARD_WARN_AFTER_MS = 2 * 60 * 60 * 1000;
export const STUCK_CARD_RELEASE_AFTER_MS = 3 * 60 * 60 * 1000;

export type AdminPaymentMethod = "card" | "havale" | "kurum";
export type AdminPaymentMethodFilter = AdminPaymentMethod | "all";
export type AdminPaymentStatusFilter = PaymentStatus | "all";
export type AdminPaymentsView = "ledger" | "stuck";

export type AdminPaymentLedgerRow = {
  id: string;
  kind: "payment" | "kurum_enrollment";
  method: AdminPaymentMethod;
  status: PaymentStatus;
  amountTryCents: number | null;
  studentName: string;
  studentEmail: string | null;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string | null;
  eventId: string;
  eventTitle: string;
  enrollmentId: string;
  enrollmentStatus: string;
  provider: string;
  providerRef: string | null;
  createdAt: string;
  paidAt: string | null;
  isStuck: boolean;
  stuckWarnedAt: string | null;
};

export function classifyAdminPaymentMethod(input: {
  provider?: string | null;
  eventPaymentMode?: string | null;
  kind?: "payment" | "kurum_enrollment";
}): AdminPaymentMethod {
  if (input.kind === "kurum_enrollment") {
    return "kurum";
  }
  if (isHavalePaymentProvider(input.provider)) {
    return "havale";
  }
  if (input.eventPaymentMode === "external" && !isCardPaymentProvider(input.provider)) {
    return "kurum";
  }
  return "card";
}

export function resolvePaymentProviderRef(input: {
  provider?: string | null;
  providerPaymentId?: string | null;
  providerConversationId?: string | null;
}): string | null {
  const dekont = input.providerPaymentId?.trim() || null;
  const conversation = input.providerConversationId?.trim() || null;
  if (isHavalePaymentProvider(input.provider)) {
    return dekont;
  }
  return conversation || dekont;
}

export function isStuckCardPayment(input: {
  method: AdminPaymentMethod;
  paymentStatus: string;
  enrollmentStatus: string;
  createdAt: string;
  nowMs?: number;
  ttlMs?: number;
}): boolean {
  if (input.method !== "card") {
    return false;
  }
  if (input.enrollmentStatus !== "pending_payment") {
    return false;
  }

  const ttl = input.ttlMs ?? STALE_CARD_CHECKOUT_TTL_MS;
  const now = input.nowMs ?? Date.now();

  if (input.paymentStatus === "failed") {
    return true;
  }

  if (input.paymentStatus !== "pending") {
    return false;
  }

  const created = Date.parse(input.createdAt);
  if (!Number.isFinite(created)) {
    return false;
  }
  return now - created >= ttl;
}

export type StuckCardSweepAction = "none" | "warn" | "release";

/** 45 dk kuyruk; 2 saat uyarı maili; 3 saat koltuğu bırak. */
export function resolveStuckCardSweepAction(input: {
  isStuck: boolean;
  createdAt: string;
  warnedAt?: string | null;
  releasedAt?: string | null;
  nowMs?: number;
  warnAfterMs?: number;
  releaseAfterMs?: number;
}): StuckCardSweepAction {
  if (!input.isStuck || input.releasedAt) {
    return "none";
  }

  const created = Date.parse(input.createdAt);
  if (!Number.isFinite(created)) {
    return "none";
  }

  const now = input.nowMs ?? Date.now();
  const ageMs = now - created;
  const releaseAfter = input.releaseAfterMs ?? STUCK_CARD_RELEASE_AFTER_MS;
  const warnAfter = input.warnAfterMs ?? STUCK_CARD_WARN_AFTER_MS;

  if (ageMs >= releaseAfter) {
    return "release";
  }
  if (ageMs >= warnAfter && !input.warnedAt) {
    return "warn";
  }
  return "none";
}

export function stuckCardReleasePlan(input: {
  paymentStatus: string;
  enrollmentStatus: string;
  isStuck: boolean;
}): "cancel_pending_and_seat" | "cancel_seat_only" | "not_actionable" {
  if (!input.isStuck || input.enrollmentStatus !== "pending_payment") {
    return "not_actionable";
  }
  if (input.paymentStatus === "pending") {
    return "cancel_pending_and_seat";
  }
  if (input.paymentStatus === "failed") {
    return "cancel_seat_only";
  }
  return "not_actionable";
}

export function whatsappHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }
  const intl = digits.startsWith("90")
    ? digits
    : digits.startsWith("0")
      ? `90${digits.slice(1)}`
      : digits;
  return `https://wa.me/${intl}`;
}

export const ADMIN_PAYMENT_METHOD_LABELS: Record<AdminPaymentMethod, string> = {
  card: "Kart",
  havale: "Havale",
  kurum: "Kurum",
};

export const ADMIN_PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Ödendi",
  pending: "Bekliyor",
  failed: "Başarısız",
  cancelled: "İptal",
  refunded: "İade",
};
