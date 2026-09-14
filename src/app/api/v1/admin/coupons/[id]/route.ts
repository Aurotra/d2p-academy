import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeCouponCode } from "@/core/domain/coupon";
import { deleteCoupon, updateCoupon } from "@/infrastructure/coupons/coupon-repository";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { apiCatchResponse, isPostgresUniqueViolation } from "@/shared/utils/api-error";

const updateSchema = z.object({
  code: z.string().min(2).max(64).optional(),
  discountRate: z.number().gt(0).lte(100).optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz kupon verisi." }, { status: 400 });
  }

  let code: string | undefined;
  if (parsed.data.code) {
    code = normalizeCouponCode(parsed.data.code);
    if (code.length < 2) {
      return NextResponse.json({ error: "İndirim kodu en az 2 karakter olmalı." }, { status: 400 });
    }
  }

  try {
    const coupon = await updateCoupon(access.client, id, {
      code,
      discountRate: parsed.data.discountRate,
      maxUses: parsed.data.maxUses,
      isActive: parsed.data.isActive,
      expiresAt:
        parsed.data.expiresAt === undefined
          ? undefined
          : parsed.data.expiresAt && parsed.data.expiresAt.trim()
            ? new Date(parsed.data.expiresAt).toISOString()
            : null,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    const status = isPostgresUniqueViolation(error) ? 409 : 500;
    const message =
      status === 409 ? "Bu indirim kodu zaten kayıtlı." : "Kupon güncellenemedi.";
    return apiCatchResponse(error, message, { logLabel: "[admin/coupons PATCH]", status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    await deleteCoupon(access.client, id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return apiCatchResponse(error, "Kupon silinemedi.", {
      logLabel: "[admin/coupons DELETE]",
      status: 500,
    });
  }
}
