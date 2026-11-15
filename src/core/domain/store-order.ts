export type StoreOrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export const STORE_ORDER_STATUS_LABELS: Record<StoreOrderStatus, string> = {
  pending_payment: "Ödeme bekleniyor",
  paid: "Ödendi — hazırlanacak",
  processing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  completed: "Tamamlandı",
  failed: "Ödeme başarısız",
  cancelled: "İptal",
  refunded: "İade edildi",
};

export const STORE_ORDER_FULFILLMENT_STATUSES: readonly StoreOrderStatus[] = [
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

export interface StoreOrder {
  id: string;
  orderNumber: string;
  status: StoreOrderStatus;
  productId: string;
  productSlug: string;
  productTitle: string;
  quantity: number;
  unitPriceTryCents: number;
  amountTryCents: number;
  currency: string;
  customerUserId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCity: string;
  shippingDistrict: string | null;
  shippingAddress: string;
  customerNote: string | null;
  provider: string;
  providerConversationId: string | null;
  providerToken: string | null;
  providerPaymentId: string | null;
  providerRaw: Record<string, unknown> | null;
  paidAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  notifiedAdminAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isStoreOrderStatus(value: string): value is StoreOrderStatus {
  return value in STORE_ORDER_STATUS_LABELS;
}

export function productPriceToTryCents(priceTry: number): number {
  return Math.round(priceTry * 100);
}
