import { describe, expect, it } from "vitest";

import {
  buildPaytrGetTokenHash,
  buildPaytrInstallmentTableScriptUrl,
  buildPaytrInstallmentTableToken,
  buildPaytrNotificationHash,
  encodePaytrBasket,
  formatPaytrInstallmentAmount,
  merchantOidFromPaymentId,
  paytrHashesMatch,
} from "@/infrastructure/payments/paytr-hash";

describe("paytr-hash", () => {
  it("strips UUID hyphens for merchant_oid", () => {
    expect(merchantOidFromPaymentId("11111111-1111-1111-1111-111111111111")).toBe(
      "11111111111111111111111111111111",
    );
  });

  it("encodes a single-item basket as base64 json", () => {
    const encoded = encodePaytrBasket("3D Atölye", "150.00");
    expect(JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))).toEqual([
      ["3D Atölye", "150.00", 1],
    ]);
  });

  it("builds a stable get-token HMAC", () => {
    const hash = buildPaytrGetTokenHash({
      merchantId: "737306",
      userIp: "1.2.3.4",
      merchantOid: "abc123",
      email: "veli@example.com",
      paymentAmount: "15000",
      userBasket: "YmFza2V0",
      noInstallment: "1",
      maxInstallment: "0",
      currency: "TL",
      testMode: "1",
      merchantSalt: "salt",
      merchantKey: "key",
    });
    expect(hash).toBe(
      buildPaytrGetTokenHash({
        merchantId: "737306",
        userIp: "1.2.3.4",
        merchantOid: "abc123",
        email: "veli@example.com",
        paymentAmount: "15000",
        userBasket: "YmFza2V0",
        noInstallment: "1",
        maxInstallment: "0",
        currency: "TL",
        testMode: "1",
        merchantSalt: "salt",
        merchantKey: "key",
      }),
    );
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies notification hash with timing-safe compare", () => {
    const hash = buildPaytrNotificationHash({
      merchantOid: "abc123",
      merchantSalt: "salt",
      status: "success",
      totalAmount: "15000",
      merchantKey: "key",
    });
    expect(paytrHashesMatch(hash, hash)).toBe(true);
    expect(paytrHashesMatch(hash, "nope")).toBe(false);
  });

  it("builds the installment table script URL with the product price", () => {
    const token = buildPaytrInstallmentTableToken({
      merchantId: "737306",
      merchantKey: "key",
      merchantSalt: "salt",
    });
    expect(token).toHaveLength(64);
    expect(formatPaytrInstallmentAmount(1300)).toBe("13.00");
    expect(
      buildPaytrInstallmentTableScriptUrl({
        merchantId: "737306",
        token: "abc",
        amountTryCents: 1350,
      }),
    ).toBe(
      "https://www.paytr.com/odeme/taksit-tablosu/v2?token=abc&merchant_id=737306&amount=13.50&taksit=0&tumu=0",
    );
  });
});
