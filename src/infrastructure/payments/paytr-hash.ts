import { createHmac, timingSafeEqual } from "node:crypto";

export function merchantOidFromPaymentId(paymentId: string): string {
  const oid = paymentId.replace(/-/g, "");
  if (!/^[A-Za-z0-9]+$/.test(oid) || oid.length > 64) {
    throw new Error("PayTR sipariş numarası geçersiz.");
  }
  return oid;
}

export function encodePaytrBasket(itemName: string, unitPriceTry: string): string {
  const basket = JSON.stringify([[itemName.slice(0, 180), unitPriceTry, 1]]);
  return Buffer.from(basket, "utf8").toString("base64");
}

export function buildPaytrGetTokenHash(input: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasket: string;
  noInstallment: string;
  maxInstallment: string;
  currency: string;
  testMode: string;
  merchantSalt: string;
  merchantKey: string;
}): string {
  const hashStr = [
    input.merchantId,
    input.userIp,
    input.merchantOid,
    input.email,
    input.paymentAmount,
    input.userBasket,
    input.noInstallment,
    input.maxInstallment,
    input.currency,
    input.testMode,
  ].join("");

  return createHmac("sha256", input.merchantKey)
    .update(hashStr + input.merchantSalt)
    .digest("base64");
}

export function buildPaytrNotificationHash(input: {
  merchantOid: string;
  merchantSalt: string;
  status: string;
  totalAmount: string;
  merchantKey: string;
}): string {
  return createHmac("sha256", input.merchantKey)
    .update(input.merchantOid + input.merchantSalt + input.status + input.totalAmount)
    .digest("base64");
}

export function paytrHashesMatch(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
