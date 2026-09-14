import { describe, expect, it } from "vitest";

import {
  buildCouponQuote,
  calculateCouponDiscount,
  normalizeCouponCode,
} from "@/core/domain/coupon";

describe("normalizeCouponCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCouponCode("  yaz25 ")).toBe("YAZ25");
  });

  it("strips internal spaces", () => {
    expect(normalizeCouponCode("YAZ 25")).toBe("YAZ25");
  });
});

describe("calculateCouponDiscount", () => {
  it("applies percent off in kuruş with rounding", () => {
    expect(calculateCouponDiscount(15000, 10)).toEqual({
      discountAmountTryCents: 1500,
      finalAmountTryCents: 13500,
    });
  });

  it("rounds half up via Math.round", () => {
    // 10001 * 15% = 1500.15 → 1500
    expect(calculateCouponDiscount(10001, 15)).toEqual({
      discountAmountTryCents: 1500,
      finalAmountTryCents: 8501,
    });
  });

  it("allows 100% off", () => {
    expect(calculateCouponDiscount(20000, 100)).toEqual({
      discountAmountTryCents: 20000,
      finalAmountTryCents: 0,
    });
  });
});

describe("buildCouponQuote", () => {
  it("includes fixed 2-decimal TRY strings", () => {
    const quote = buildCouponQuote({
      couponId: "c1",
      code: "TEST10",
      discountRate: 10,
      originalAmountTryCents: 15000,
    });

    expect(quote.originalAmountTry).toBe("150.00");
    expect(quote.discountAmountTry).toBe("15.00");
    expect(quote.finalAmountTry).toBe("135.00");
    expect(quote.finalAmountTryCents).toBe(13500);
  });
});
