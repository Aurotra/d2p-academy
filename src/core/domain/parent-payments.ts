import type { PaymentStatus } from "@/core/domain/payment";

export type ParentPaymentListItem = {
  id: string;
  eventTitle: string;
  studentName: string;
  amountTryCents: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};

export const PARENT_PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Ödendi",
  pending: "Beklemede",
  failed: "Başarısız",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

export const PARENT_PAYMENTS_LIST_LIMIT = 50;

/**
 * Defense-in-depth: only keep rows whose payer matches the authenticated parent.
 * RLS already enforces this; this filter protects against accidental query mistakes in tests/code.
 */
export function filterPaymentsOwnedByParent<T extends { payerUserId: string }>(
  rows: T[],
  parentUserId: string,
): T[] {
  return rows.filter((row) => row.payerUserId === parentUserId);
}
