import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { after } from "next/server";

import { isStoreOrderStatus } from "@/core/domain/store-order";
import { parseAdminNotificationEmails } from "@/infrastructure/email/admin-enrollment-notify";
import { sendStoreOrderAdminEmail } from "@/infrastructure/email/store-order-admin-email";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";

async function resolveAdminNotificationEmails(client: SupabaseClient): Promise<string[]> {
  const fromEnv = parseAdminNotificationEmails(process.env.ADMIN_EMAIL);
  if (fromEnv.length > 0) {
    return fromEnv;
  }

  const { data } = await client
    .from("profiles")
    .select("email")
    .eq("role", "admin")
    .eq("is_active", true);

  return parseAdminNotificationEmails(
    (data ?? [])
      .map((row) => (typeof row.email === "string" ? row.email : ""))
      .join(","),
  );
}

export async function notifyAdminOfStoreOrder(
  client: SupabaseClient,
  orderId: string,
): Promise<void> {
  try {
    if (!isResendConfigured()) {
      console.warn("[admin store order notify] RESEND_API_KEY missing; skipped");
      return;
    }

    const { data, error } = await client
      .from("store_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      console.error(
        "[admin store order notify] lookup failed",
        error?.message ?? "missing row",
      );
      return;
    }

    const order = mapStoreOrderRow(data as StoreOrderRow);
    if (order.status !== "paid" && order.status !== "processing") {
      return;
    }

    if (order.notifiedAdminAt) {
      return;
    }

    const recipients = await resolveAdminNotificationEmails(client);
    if (recipients.length === 0) {
      console.warn(
        "[admin store order notify] ADMIN_EMAIL unset and no admin profile emails; skipped",
      );
      return;
    }

    const status = isStoreOrderStatus(order.status) ? order.status : "paid";
    const results = await Promise.allSettled(
      recipients.map((to) =>
        sendStoreOrderAdminEmail(to, {
          orderNumber: order.orderNumber,
          status,
          productTitle: order.productTitle,
          quantity: order.quantity,
          amountTryCents: order.amountTryCents,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingCity: order.shippingCity,
          shippingDistrict: order.shippingDistrict,
          shippingAddress: order.shippingAddress,
          customerNote: order.customerNote,
        }),
      ),
    );

    let sent = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[admin store order notify] send failed", result.reason);
      } else {
        sent += 1;
      }
    }

    if (sent > 0) {
      await client
        .from("store_orders")
        .update({ notified_admin_at: new Date().toISOString() })
        .eq("id", orderId)
        .is("notified_admin_at", null);

      console.info("[admin store order notify] sent", {
        orderId,
        orderNumber: order.orderNumber,
        sent,
      });
    }
  } catch (error) {
    console.error("[admin store order notify]", error);
  }
}

export function scheduleAdminStoreOrderNotify(
  client: SupabaseClient,
  orderId: string,
): void {
  try {
    after(() => notifyAdminOfStoreOrder(client, orderId));
  } catch (error) {
    console.warn(
      "[admin store order notify] after() unavailable; running inline",
      error instanceof Error ? error.message : error,
    );
    void notifyAdminOfStoreOrder(client, orderId);
  }
}
