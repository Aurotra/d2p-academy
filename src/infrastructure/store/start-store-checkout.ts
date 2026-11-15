import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { productPriceToTryCents } from "@/core/domain/store-order";
import { getStoreProductBySlug } from "@/shared/constants/store-products";
import { SITE_URL } from "@/shared/constants/site";
import {
  initializePaytrCheckout,
  isPaytrConfigured,
} from "@/infrastructure/payments/paytr-client";
import { merchantOidFromPaymentId } from "@/infrastructure/payments/paytr-hash";
import {
  buildStoreOrderNumber,
  mapStoreOrderRow,
  type StoreOrderRow,
} from "@/infrastructure/store/map-store-order";

function siteBase(): string {
  return SITE_URL.replace(/\/$/, "");
}

export interface StartStoreCheckoutInput {
  serviceClient: SupabaseClient;
  productSlug: string;
  quantity?: number;
  customerUserId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCity: string;
  shippingDistrict?: string | null;
  shippingAddress: string;
  customerNote?: string | null;
  buyerIp: string;
}

export async function startStoreCheckout(input: StartStoreCheckoutInput): Promise<{
  orderId: string;
  orderNumber: string;
  paymentPageUrl: string;
  amountTryCents: number;
}> {
  if (!isPaytrConfigured()) {
    throw new Error("PayTR ödeme yapılandırması eksik.");
  }

  const product = getStoreProductBySlug(input.productSlug);
  if (!product) {
    throw new Error("Ürün bulunamadı.");
  }
  if (product.stockStatus === "out_of_stock") {
    throw new Error("Bu ürün şu an stokta yok.");
  }

  const quantity = Math.min(20, Math.max(1, Math.floor(input.quantity ?? 1)));
  const unitPriceTryCents = productPriceToTryCents(product.price);
  const amountTryCents = unitPriceTryCents * quantity;

  const customerName = input.customerName.trim();
  const customerEmail = input.customerEmail.trim().toLowerCase();
  const customerPhone = input.customerPhone.trim();
  const shippingCity = input.shippingCity.trim();
  const shippingAddress = input.shippingAddress.trim();
  const shippingDistrict = input.shippingDistrict?.trim() || null;
  const customerNote = input.customerNote?.trim() || null;

  if (!customerName || !customerEmail.includes("@") || !customerPhone) {
    throw new Error("İsim, e-posta ve telefon zorunludur.");
  }
  if (!shippingCity || !shippingAddress) {
    throw new Error("Teslimat adresi zorunludur.");
  }

  let orderNumber = buildStoreOrderNumber();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: existing } = await input.serviceClient
      .from("store_orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!existing) {
      break;
    }
    orderNumber = buildStoreOrderNumber();
  }

  const { data: created, error: createError } = await input.serviceClient
    .from("store_orders")
    .insert({
      order_number: orderNumber,
      status: "pending_payment",
      product_id: product.id,
      product_slug: product.slug,
      product_title: product.title,
      quantity,
      unit_price_try_cents: unitPriceTryCents,
      amount_try_cents: amountTryCents,
      currency: "TRY",
      customer_user_id: input.customerUserId ?? null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_city: shippingCity,
      shipping_district: shippingDistrict,
      shipping_address: shippingAddress,
      customer_note: customerNote,
      provider: "paytr",
    })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message || "Sipariş oluşturulamadı.");
  }

  const order = mapStoreOrderRow(created as StoreOrderRow);
  const merchantOid = merchantOidFromPaymentId(order.id);
  const addressLine = [shippingAddress, shippingDistrict, shippingCity]
    .filter(Boolean)
    .join(", ");

  const init = await initializePaytrCheckout({
    paymentId: order.id,
    priceTryCents: amountTryCents,
    eventTitle: `${product.title}${quantity > 1 ? ` x${quantity}` : ""}`,
    buyer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      ip: input.buyerIp,
      address: addressLine,
    },
    okUrl: `${siteBase()}/magaza/odeme/basarili?orderId=${encodeURIComponent(order.id)}`,
    failUrl: `${siteBase()}/magaza/odeme/basarisiz?orderId=${encodeURIComponent(order.id)}`,
  });

  const { error: updateError } = await input.serviceClient
    .from("store_orders")
    .update({
      provider_conversation_id: merchantOid,
      provider_token: init.token,
      provider_raw: {
        iframeUrl: init.iframeUrl,
        merchantOid: init.merchantOid,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    throw new Error(updateError.message || "Ödeme oturumu kaydedilemedi.");
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentPageUrl: `${siteBase()}/magaza/odeme/${order.id}?fresh=1`,
    amountTryCents,
  };
}

export async function rotateStorePaytrCheckout(params: {
  serviceClient: SupabaseClient;
  orderId: string;
  buyerIp: string;
}): Promise<{ iframeUrl: string }> {
  const { data, error } = await params.serviceClient
    .from("store_orders")
    .select("*")
    .eq("id", params.orderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Sipariş bulunamadı.");
  }

  const order = mapStoreOrderRow(data as StoreOrderRow);
  if (order.status !== "pending_payment") {
    throw new Error("Bu sipariş için ödeme yenilenemez.");
  }

  const merchantOid = merchantOidFromPaymentId(order.id);
  const addressLine = [
    order.shippingAddress,
    order.shippingDistrict,
    order.shippingCity,
  ]
    .filter(Boolean)
    .join(", ");

  const init = await initializePaytrCheckout({
    paymentId: order.id,
    priceTryCents: order.amountTryCents,
    eventTitle: `${order.productTitle}${order.quantity > 1 ? ` x${order.quantity}` : ""}`,
    buyer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      ip: params.buyerIp,
      address: addressLine,
    },
    okUrl: `${siteBase()}/magaza/odeme/basarili?orderId=${encodeURIComponent(order.id)}`,
    failUrl: `${siteBase()}/magaza/odeme/basarisiz?orderId=${encodeURIComponent(order.id)}`,
  });

  await params.serviceClient
    .from("store_orders")
    .update({
      provider_conversation_id: merchantOid,
      provider_token: init.token,
      provider_raw: {
        iframeUrl: init.iframeUrl,
        merchantOid: init.merchantOid,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return { iframeUrl: init.iframeUrl };
}
