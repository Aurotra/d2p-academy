import {
  isStoreOrderStatus,
  type StoreOrder,
  type StoreOrderStatus,
} from "@/core/domain/store-order";

export interface StoreOrderRow {
  id: string;
  order_number: string;
  status: string;
  product_id: string;
  product_slug: string;
  product_title: string;
  quantity: number;
  unit_price_try_cents: number;
  amount_try_cents: number;
  currency: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_city: string;
  shipping_district: string | null;
  shipping_address: string;
  customer_note: string | null;
  provider: string;
  provider_conversation_id: string | null;
  provider_token: string | null;
  provider_payment_id: string | null;
  provider_raw: Record<string, unknown> | null;
  paid_at: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
  admin_note: string | null;
  notified_admin_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapStoreOrderRow(row: StoreOrderRow): StoreOrder {
  const status: StoreOrderStatus = isStoreOrderStatus(row.status)
    ? row.status
    : "pending_payment";

  return {
    id: row.id,
    orderNumber: row.order_number,
    status,
    productId: row.product_id,
    productSlug: row.product_slug,
    productTitle: row.product_title,
    quantity: row.quantity,
    unitPriceTryCents: row.unit_price_try_cents,
    amountTryCents: row.amount_try_cents,
    currency: row.currency,
    customerUserId: row.customer_user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingCity: row.shipping_city,
    shippingDistrict: row.shipping_district,
    shippingAddress: row.shipping_address,
    customerNote: row.customer_note,
    provider: row.provider,
    providerConversationId: row.provider_conversation_id,
    providerToken: row.provider_token,
    providerPaymentId: row.provider_payment_id,
    providerRaw: row.provider_raw,
    paidAt: row.paid_at,
    shippedAt: row.shipped_at,
    trackingNumber: row.tracking_number,
    adminNote: row.admin_note,
    notifiedAdminAt: row.notified_admin_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildStoreOrderNumber(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `S${y}${m}${d}-${rand}`;
}
