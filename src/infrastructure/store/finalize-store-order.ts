import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyAdminOfStoreOrder } from "@/infrastructure/email/notify-admin-store-order";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";

export async function finalizeStoreOrderPaid(params: {
  serviceClient: SupabaseClient;
  orderId: string;
  providerPaymentId: string | null;
  raw: Record<string, unknown>;
}): Promise<{ orderId: string; alreadyPaid: boolean }> {
  const { data, error } = await params.serviceClient
    .from("store_orders")
    .select("*")
    .eq("id", params.orderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Sipariş bulunamadı.");
  }

  const order = mapStoreOrderRow(data as StoreOrderRow);

  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "completed") {
    return { orderId: order.id, alreadyPaid: true };
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    throw new Error("İptal/iade edilmiş sipariş ödenemez.");
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await params.serviceClient
    .from("store_orders")
    .update({
      status: "paid",
      paid_at: now,
      provider_payment_id: params.providerPaymentId,
      provider_raw: {
        ...(order.providerRaw ?? {}),
        callback: params.raw,
      },
      updated_at: now,
    })
    .eq("id", order.id)
    .in("status", ["pending_payment", "failed"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message || "Sipariş güncellenemedi.");
  }

  if (!updated) {
    // Race: another callback already marked paid.
    return { orderId: order.id, alreadyPaid: true };
  }

  await notifyAdminOfStoreOrder(params.serviceClient, order.id);
  return { orderId: order.id, alreadyPaid: false };
}

export async function markStoreOrderFailed(params: {
  serviceClient: SupabaseClient;
  orderId: string;
  raw: Record<string, unknown>;
}): Promise<void> {
  const { data } = await params.serviceClient
    .from("store_orders")
    .select("id, status, provider_raw")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!data || data.status !== "pending_payment") {
    return;
  }

  const previousRaw =
    data.provider_raw && typeof data.provider_raw === "object" && !Array.isArray(data.provider_raw)
      ? (data.provider_raw as Record<string, unknown>)
      : {};

  await params.serviceClient
    .from("store_orders")
    .update({
      status: "failed",
      provider_raw: {
        ...previousRaw,
        callback: params.raw,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.orderId)
    .eq("status", "pending_payment");
}
