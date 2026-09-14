import { NextResponse } from "next/server";
import { z } from "zod";

import { CouponValidationError } from "@/core/domain/coupon";
import { validateCouponForAmount } from "@/infrastructure/coupons/coupon-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { apiCatchResponse } from "@/shared/utils/api-error";

const schema = z.object({
  code: z.string().min(1).max(64),
  /** List price in kuruş (TRY cents). */
  baseAmountTryCents: z.number().int().positive().optional(),
  /** Alias: decimal TL string/number — converted server-side. */
  baseAmount: z.union([z.number(), z.string()]).optional(),
});

function resolveBaseAmountTryCents(parsed: z.infer<typeof schema>): number | null {
  if (parsed.baseAmountTryCents != null) {
    return parsed.baseAmountTryCents;
  }

  if (parsed.baseAmount == null) {
    return null;
  }

  const asNumber =
    typeof parsed.baseAmount === "number"
      ? parsed.baseAmount
      : Number(String(parsed.baseAmount).replace(",", "."));

  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return null;
  }

  return Math.round(asNumber * 100);
}

/**
 * Validates a coupon without incrementing used_count.
 * Auth required (parent checkout). Amounts returned with toFixed(2) TRY strings.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz kupon isteği." }, { status: 400 });
    }

    const baseAmountTryCents = resolveBaseAmountTryCents(parsed.data);
    if (baseAmountTryCents == null) {
      return NextResponse.json(
        { error: "Geçerli bir sipariş tutarı (baseAmount / baseAmountTryCents) gerekli." },
        { status: 400 },
      );
    }

    const serviceClient = createServiceRoleClient();
    const quote = await validateCouponForAmount(serviceClient, {
      code: parsed.data.code,
      baseAmountTryCents,
    });

    return NextResponse.json({
      data: {
        valid: true,
        couponId: quote.couponId,
        code: quote.code,
        discountRate: quote.discountRate,
        originalAmountTryCents: quote.originalAmountTryCents,
        discountAmountTryCents: quote.discountAmountTryCents,
        finalAmountTryCents: quote.finalAmountTryCents,
        originalAmount: quote.originalAmountTry,
        discountAmount: quote.discountAmountTry,
        finalAmount: quote.finalAmountTry,
        originalAmountDisplay: quote.originalAmountDisplay,
        discountAmountDisplay: quote.discountAmountDisplay,
        finalAmountDisplay: quote.finalAmountDisplay,
      },
    });
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code, data: { valid: false } },
        { status: 400 },
      );
    }

    return apiCatchResponse(error, "İndirim kodu doğrulanamadı.", {
      logLabel: "[coupons/validate]",
      status: 500,
    });
  }
}
