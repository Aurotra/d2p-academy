import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeCouponCode } from "@/core/domain/coupon";
import { createCoupon, listCoupons } from "@/infrastructure/coupons/coupon-repository";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { apiCatchResponse, isPostgresUniqueViolation } from "@/shared/utils/api-error";

const createSchema = z.object({
  code: z.string().min(2).max(64),
  discountRate: z.number().gt(0).lte(100),
  maxUses: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .refine((value) => value == null || value === "" || !Number.isNaN(Date.parse(value)), {
      message: "Geçersiz tarih",
    }),
});

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const coupons = await listCoupons(access.client);
    return NextResponse.json({
      data: {
        coupons: coupons.map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          discountRate: coupon.discountRate,
          maxUses: coupon.maxUses,
          usedCount: coupon.usedCount,
          isActive: coupon.isActive,
          expiresAt: coupon.expiresAt?.toISOString() ?? null,
          createdAt: coupon.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return apiCatchResponse(error, "Kuponlar alınamadı.", {
      logLabel: "[admin coupons GET]",
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz kupon verisi." }, { status: 400 });
  }

  const code = normalizeCouponCode(parsed.data.code);
  if (code.length < 2) {
    return NextResponse.json({ error: "İndirim kodu en az 2 karakter olmalı." }, { status: 400 });
  }

  try {
    const coupon = await createCoupon(access.client, {
      code,
      discountRate: parsed.data.discountRate,
      maxUses: parsed.data.maxUses ?? null,
      isActive: parsed.data.isActive ?? true,
      expiresAt:
        parsed.data.expiresAt && parsed.data.expiresAt.trim()
          ? new Date(parsed.data.expiresAt).toISOString()
          : null,
    });

    return NextResponse.json(
      {
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            discountRate: coupon.discountRate,
            maxUses: coupon.maxUses,
            usedCount: coupon.usedCount,
            isActive: coupon.isActive,
            expiresAt: coupon.expiresAt?.toISOString() ?? null,
            createdAt: coupon.createdAt.toISOString(),
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const status = isPostgresUniqueViolation(error) ? 409 : 500;
    const message =
      status === 409 ? "Bu indirim kodu zaten kayıtlı." : "Kupon oluşturulamadı.";
    return apiCatchResponse(error, message, { logLabel: "[admin coupons POST]", status });
  }
}
