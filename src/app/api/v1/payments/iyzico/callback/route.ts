import { NextResponse } from "next/server";

import {
  finalizePaidPayment,
  markPaymentFailed,
} from "@/infrastructure/payments/start-paid-enrollment-checkout";
import { retrieveIyzicoCheckout } from "@/infrastructure/payments/iyzico-client";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { SITE_URL } from "@/shared/constants/site";

function redirectTo(path: string) {
  const base = SITE_URL.replace(/\/$/, "");
  return NextResponse.redirect(`${base}${path}`, { status: 303 });
}

async function handleCallback(request: Request) {
  let token = "";

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await request.json().catch(() => null)) as { token?: string } | null;
      token = json?.token?.trim() ?? "";
    } else {
      const formData = await request.formData();
      token = String(formData.get("token") ?? "").trim();
    }
  } catch {
    token = "";
  }

  if (!token) {
    return redirectTo("/odeme/basarisiz?reason=token");
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return redirectTo("/odeme/basarisiz?reason=config");
  }

  let retrieve;
  try {
    retrieve = await retrieveIyzicoCheckout(token);
  } catch (error) {
    console.error("[iyzico callback retrieve]", error);
    return redirectTo("/odeme/basarisiz?reason=retrieve");
  }

  const conversationId =
    typeof retrieve.raw.conversationId === "string"
      ? retrieve.raw.conversationId
      : null;

  const { data: paymentByToken } = await serviceClient
    .from("payments")
    .select("id, enrollment_id, student_user_id, status")
    .eq("provider_token", token)
    .maybeSingle();

  const paymentId = paymentByToken?.id ?? conversationId;
  if (!paymentId) {
    return redirectTo("/odeme/basarisiz?reason=payment");
  }

  const paymentStatus = (retrieve.paymentStatus ?? "").toUpperCase();
  const success =
    retrieve.status === "success" &&
    (paymentStatus === "SUCCESS" || paymentStatus === "SUCCESSFUL");

  if (!success) {
    try {
      await markPaymentFailed({
        serviceClient,
        paymentId,
        raw: retrieve.raw,
      });
    } catch (error) {
      console.error("[iyzico callback mark failed]", error);
    }
    return redirectTo(`/odeme/basarisiz?paymentId=${encodeURIComponent(paymentId)}`);
  }

  try {
    const finalized = await finalizePaidPayment({
      serviceClient,
      paymentId,
      providerPaymentId: retrieve.paymentId,
      raw: retrieve.raw,
    });

    // alreadyPaid / unique-conflict→alreadyPaid: success page (no failure UX)
    if (finalized.recovered) {
      console.error(
        "[iyzico callback] recovered cancelled/failed payment after SUCCESS — ops review",
        { paymentId, enrollmentId: finalized.enrollmentId },
      );
    }

    const params = new URLSearchParams({
      enrollmentId: finalized.enrollmentId,
      studentId: finalized.studentUserId,
    });
    return redirectTo(`/odeme/basarili?${params.toString()}`);
  } catch (error) {
    console.error("[iyzico callback finalize]", error);
    return redirectTo(`/odeme/basarisiz?paymentId=${encodeURIComponent(paymentId)}`);
  }
}

export async function POST(request: Request) {
  return handleCallback(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return redirectTo("/odeme/basarisiz?reason=token");
  }

  const formBody = new URLSearchParams({ token });
  const synthetic = new Request(request.url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });
  return handleCallback(synthetic);
}
