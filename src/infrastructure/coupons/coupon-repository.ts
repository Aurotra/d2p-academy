import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCouponQuote,
  CouponValidationError,
  normalizeCouponCode,
  type CouponDefinition,
  type CouponQuote,
  type UpsertCouponInput,
} from "@/core/domain/coupon";

interface CouponRow {
  id: string;
  code: string;
  discount_rate: number | string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export function mapCouponRow(row: CouponRow): CouponDefinition {
  return {
    id: row.id,
    code: row.code,
    discountRate: toNumber(row.discount_rate),
    maxUses: row.max_uses,
    usedCount: row.used_count,
    isActive: row.is_active,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function assertCouponStillRedeemable(coupon: CouponDefinition): void {
  if (!coupon.isActive) {
    throw new CouponValidationError(
      "COUPON_INACTIVE",
      "Bu indirim kodu artık geçerli değil.",
    );
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
    throw new CouponValidationError(
      "COUPON_EXPIRED",
      "Bu indirim kodunun süresi dolmuş.",
    );
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponValidationError(
      "COUPON_EXHAUSTED",
      "Bu indirim kodunun kullanım limiti dolmuş.",
    );
  }
}

/**
 * Server-side coupon validation. Does NOT increment used_count.
 */
export async function validateCouponForAmount(
  client: SupabaseClient,
  input: { code: string; baseAmountTryCents: number },
): Promise<CouponQuote> {
  const code = normalizeCouponCode(input.code);
  if (!code) {
    throw new CouponValidationError("CODE_REQUIRED", "İndirim kodu girin.");
  }

  if (
    !Number.isFinite(input.baseAmountTryCents) ||
    !Number.isInteger(input.baseAmountTryCents) ||
    input.baseAmountTryCents <= 0
  ) {
    throw new CouponValidationError(
      "BASE_AMOUNT_INVALID",
      "Geçerli bir sipariş tutarı gerekli.",
    );
  }

  const { data, error } = await client
    .from("coupons")
    .select("id, code, discount_rate, max_uses, used_count, is_active, expires_at, created_at")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new CouponValidationError("COUPON_NOT_FOUND", "İndirim kodu bulunamadı.");
  }

  const coupon = mapCouponRow(data as CouponRow);
  assertCouponStillRedeemable(coupon);

  return buildCouponQuote({
    couponId: coupon.id,
    code: coupon.code,
    discountRate: coupon.discountRate,
    originalAmountTryCents: input.baseAmountTryCents,
  });
}

export async function listCoupons(client: SupabaseClient): Promise<CouponDefinition[]> {
  const { data, error } = await client
    .from("coupons")
    .select("id, code, discount_rate, max_uses, used_count, is_active, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CouponRow[]).map(mapCouponRow);
}

export async function createCoupon(
  client: SupabaseClient,
  input: UpsertCouponInput,
): Promise<CouponDefinition> {
  const code = normalizeCouponCode(input.code);
  if (!code) {
    throw new Error("İndirim kodu zorunludur.");
  }

  const { data, error } = await client
    .from("coupons")
    .insert({
      code,
      discount_rate: input.discountRate,
      max_uses: input.maxUses ?? null,
      is_active: input.isActive ?? true,
      expires_at: input.expiresAt ?? null,
    })
    .select("id, code, discount_rate, max_uses, used_count, is_active, expires_at, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Kupon oluşturulamadı.");
  }

  return mapCouponRow(data as CouponRow);
}

export async function updateCoupon(
  client: SupabaseClient,
  id: string,
  input: Partial<UpsertCouponInput>,
): Promise<CouponDefinition> {
  const patch: Record<string, unknown> = {};

  if (input.code !== undefined) {
    const code = normalizeCouponCode(input.code);
    if (!code) {
      throw new Error("İndirim kodu zorunludur.");
    }
    patch.code = code;
  }
  if (input.discountRate !== undefined) {
    patch.discount_rate = input.discountRate;
  }
  if (input.maxUses !== undefined) {
    patch.max_uses = input.maxUses;
  }
  if (input.isActive !== undefined) {
    patch.is_active = input.isActive;
  }
  if (input.expiresAt !== undefined) {
    patch.expires_at = input.expiresAt;
  }

  const { data, error } = await client
    .from("coupons")
    .update(patch)
    .eq("id", id)
    .select("id, code, discount_rate, max_uses, used_count, is_active, expires_at, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Kupon güncellenemedi.");
  }

  return mapCouponRow(data as CouponRow);
}

export async function deleteCoupon(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("coupons").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
