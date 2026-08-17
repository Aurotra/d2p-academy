import { NextResponse } from "next/server";

import {
  parsePaytrNotification,
  verifyPaytrNotification,
} from "@/infrastructure/payments/paytr-client";
import {
  finalizePaidPayment,
  markPaymentFailed,
} from "@/infrastructure/payments/start-paid-enrollment-checkout";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

function ok() {
  return new NextResponse("OK", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function fail(message: string, status = 400) {
  console.error("[paytr callback]", message);
  return new NextResponse(message, { status });
}

export async function POST(request: Request) {
  let form: URLSearchParams;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await request.json().catch(() => null)) as Record<string, string> | null;
      form = new URLSearchParams(json ?? {});
    } else {
      const formData = await request.formData();
      form = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          form.set(key, value);
        }
      }
    }
  } catch {
    return fail("invalid body");
  }

  let notification;
  try {
    notification = parsePaytrNotification(form);
  } catch {
    return fail("parse failed");
  }

  let valid = false;
  try {
    valid = verifyPaytrNotification(notification);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "config");
  }

  if (!valid) {
    return fail("bad hash");
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return fail("config", 500);
  }

  const { data: payment } = await serviceClient
    .from("payments")
    .select("id, status")
    .eq("provider", "paytr")
    .eq("provider_conversation_id", notification.merchantOid)
    .maybeSingle();

  if (!payment) {
    return fail("payment not found");
  }

  if (payment.status === "paid") {
    return ok();
  }

  if (notification.status === "success") {
    try {
      await finalizePaidPayment({
        serviceClient,
        paymentId: payment.id,
        providerPaymentId: notification.merchantOid,
        raw: notification.raw,
      });
    } catch (error) {
      console.error("[paytr callback finalize]", error);
      return fail("finalize failed", 500);
    }
    return ok();
  }

  try {
    await markPaymentFailed({
      serviceClient,
      paymentId: payment.id,
      raw: notification.raw,
    });
  } catch (error) {
    console.error("[paytr callback mark failed]", error);
  }

  return ok();
}
