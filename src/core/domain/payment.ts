export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface PaymentRecord {
  id: string;
  enrollmentId: string;
  eventId: string;
  payerUserId: string;
  studentUserId: string;
  amountTryCents: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerConversationId: string | null;
  providerToken: string | null;
  providerPaymentId: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

/** Format kuruş → "150.00" for iyzico price fields. */
export function formatTryCentsAsIyzicoPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Format kuruş for UI: "150 ₺" */
export function formatTryCentsDisplay(cents: number): string {
  const lira = cents / 100;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: lira % 1 === 0 ? 0 : 2,
  }).format(lira);
}
