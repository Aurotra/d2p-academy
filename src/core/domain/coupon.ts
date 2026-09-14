import { formatTryCentsAsIyzicoPrice, formatTryCentsDisplay } from "@/core/domain/payment";

export interface CouponDefinition {
  id: string;
  code: string;
  discountRate: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface UpsertCouponInput {
  code: string;
  discountRate: number;
  maxUses?: number | null;
  isActive?: boolean;
  expiresAt?: string | null;
}

export interface CouponQuote {
  couponId: string;
  code: string;
  discountRate: number;
  originalAmountTryCents: number;
  discountAmountTryCents: number;
  finalAmountTryCents: number;
  /** TL strings with 2 decimals for API/UI (e.g. "127.50") */
  originalAmountTry: string;
  discountAmountTry: string;
  finalAmountTry: string;
  originalAmountDisplay: string;
  discountAmountDisplay: string;
  finalAmountDisplay: string;
}

export type CouponValidationErrorCode =
  | "CODE_REQUIRED"
  | "BASE_AMOUNT_INVALID"
  | "COUPON_NOT_FOUND"
  | "COUPON_INACTIVE"
  | "COUPON_EXPIRED"
  | "COUPON_EXHAUSTED";

export class CouponValidationError extends Error {
  readonly code: CouponValidationErrorCode;

  constructor(code: CouponValidationErrorCode, message: string) {
    super(message);
    this.name = "CouponValidationError";
    this.code = code;
  }
}

/** Normalize coupon codes: trim + uppercase ASCII letters. */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Percent discount in integer kuruş.
 * discount = round(base * rate / 100); final = max(0, base - discount).
 */
export function calculateCouponDiscount(
  baseAmountTryCents: number,
  discountRate: number,
): { discountAmountTryCents: number; finalAmountTryCents: number } {
  if (!Number.isFinite(baseAmountTryCents) || baseAmountTryCents < 0) {
    throw new CouponValidationError("BASE_AMOUNT_INVALID", "Geçersiz tutar.");
  }
  if (!Number.isFinite(discountRate) || discountRate <= 0 || discountRate > 100) {
    throw new CouponValidationError("BASE_AMOUNT_INVALID", "Geçersiz indirim oranı.");
  }

  const discountAmountTryCents = Math.min(
    baseAmountTryCents,
    Math.round((baseAmountTryCents * discountRate) / 100),
  );
  const finalAmountTryCents = Math.max(0, baseAmountTryCents - discountAmountTryCents);

  return { discountAmountTryCents, finalAmountTryCents };
}

export function buildCouponQuote(input: {
  couponId: string;
  code: string;
  discountRate: number;
  originalAmountTryCents: number;
}): CouponQuote {
  const { discountAmountTryCents, finalAmountTryCents } = calculateCouponDiscount(
    input.originalAmountTryCents,
    input.discountRate,
  );

  return {
    couponId: input.couponId,
    code: input.code,
    discountRate: input.discountRate,
    originalAmountTryCents: input.originalAmountTryCents,
    discountAmountTryCents,
    finalAmountTryCents,
    originalAmountTry: formatTryCentsAsIyzicoPrice(input.originalAmountTryCents),
    discountAmountTry: formatTryCentsAsIyzicoPrice(discountAmountTryCents),
    finalAmountTry: formatTryCentsAsIyzicoPrice(finalAmountTryCents),
    originalAmountDisplay: formatTryCentsDisplay(input.originalAmountTryCents),
    discountAmountDisplay: formatTryCentsDisplay(discountAmountTryCents),
    finalAmountDisplay: formatTryCentsDisplay(finalAmountTryCents),
  };
}
