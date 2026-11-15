import { NextResponse } from "next/server";

import { startStoreCheckout } from "@/infrastructure/store/start-store-checkout";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { getClientIp } from "@/lib/utils/request-ip";
import { apiCatchResponse } from "@/shared/utils/api-error";

interface CheckoutBody {
  productSlug?: string;
  quantity?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingAddress?: string;
  customerNote?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const productSlug = body.productSlug?.trim() ?? "";
    if (!productSlug) {
      return NextResponse.json({ error: "Ürün seçilmedi." }, { status: 400 });
    }

    let customerUserId: string | null = null;
    try {
      const sessionClient = await createSupabaseServerClient();
      if (sessionClient) {
        const {
          data: { user },
        } = await sessionClient.auth.getUser();
        customerUserId = user?.id ?? null;
      }
    } catch {
      customerUserId = null;
    }

    const serviceClient = createServiceRoleClient();
    const checkout = await startStoreCheckout({
      serviceClient,
      productSlug,
      quantity: body.quantity,
      customerUserId,
      customerName: body.customerName ?? "",
      customerEmail: body.customerEmail ?? "",
      customerPhone: body.customerPhone ?? "",
      shippingCity: body.shippingCity ?? "",
      shippingDistrict: body.shippingDistrict,
      shippingAddress: body.shippingAddress ?? "",
      customerNote: body.customerNote,
      buyerIp: getClientIp(request) ?? "85.34.78.112",
    });

    return NextResponse.json({ data: checkout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme başlatılamadı.";
    if (
      message.includes("zorunlu") ||
      message.includes("bulunamadı") ||
      message.includes("stokta")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return apiCatchResponse(error, "Ödeme başlatılamadı.", {
      logLabel: "[store checkout]",
      status: 502,
    });
  }
}
