import { NextResponse } from "next/server";

import {
  isStoreOrderStatus,
  STORE_ORDER_FULFILLMENT_STATUSES,
  type StoreOrderStatus,
} from "@/core/domain/store-order";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function GET(request: Request) {
  try {
    const client = await createSupabaseServerClient();
    if (!client) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const access = await getAdminAccess(client);
    if (!access.authorized) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim() ?? "";
    const q = url.searchParams.get("q")?.trim() ?? "";

    let query = client
      .from("store_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status && isStoreOrderStatus(status)) {
      query = query.eq("status", status);
    }

    if (q) {
      query = query.or(
        `order_number.ilike.%${q}%,customer_email.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,product_title.ilike.%${q}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: ((data ?? []) as StoreOrderRow[]).map((row) => mapStoreOrderRow(row)),
    });
  } catch (error) {
    return apiCatchResponse(error, "Siparişler yüklenemedi.", {
      logLabel: "[admin store-orders GET]",
      status: 500,
    });
  }
}

interface PatchBody {
  orderId?: string;
  status?: string;
  trackingNumber?: string | null;
  adminNote?: string | null;
}

export async function PATCH(request: Request) {
  try {
    const client = await createSupabaseServerClient();
    if (!client) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const access = await getAdminAccess(client);
    if (!access.authorized) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const body = (await request.json()) as PatchBody;
    const orderId = body.orderId?.trim() ?? "";
    if (!orderId) {
      return NextResponse.json({ error: "Sipariş seçilmedi." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status != null) {
      if (!isStoreOrderStatus(body.status)) {
        return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
      }
      if (
        !STORE_ORDER_FULFILLMENT_STATUSES.includes(body.status as StoreOrderStatus) &&
        body.status !== "failed"
      ) {
        return NextResponse.json({ error: "Bu duruma geçiş yapılamaz." }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === "shipped") {
        updates.shipped_at = new Date().toISOString();
      }
    }

    if (body.trackingNumber !== undefined) {
      updates.tracking_number = body.trackingNumber?.trim() || null;
    }
    if (body.adminNote !== undefined) {
      updates.admin_note = body.adminNote?.trim() || null;
    }

    const { data, error } = await client
      .from("store_orders")
      .update(updates)
      .eq("id", orderId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ data: mapStoreOrderRow(data as StoreOrderRow) });
  } catch (error) {
    return apiCatchResponse(error, "Sipariş güncellenemedi.", {
      logLabel: "[admin store-orders PATCH]",
      status: 500,
    });
  }
}
