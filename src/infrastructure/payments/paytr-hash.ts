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

/** PayTR merchant-panel installment table token (HMAC-SHA256 hex). */
export function buildPaytrInstallmentTableToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
}): string {
  return createHmac("sha256", input.merchantKey)
    .update(input.merchantId + input.merchantSalt)
    .digest("hex");
}

export function formatPaytrInstallmentAmount(amountTryCents: number): string {
  return (amountTryCents / 100).toFixed(2);
}

export function buildPaytrInstallmentTableScriptUrl(input: {
  merchantId: string;
  token: string;
  amountTryCents: number;
}): string {
  const params = new URLSearchParams({
    token: input.token,
    merchant_id: input.merchantId,
    amount: formatPaytrInstallmentAmount(input.amountTryCents),
    taksit: "0",
    tumu: "0",
  });
  return `https://www.paytr.com/odeme/taksit-tablosu/v2?${params.toString()}`;
}

export function resolvePaytrInstallmentTableToken(): string | null {
  const override = process.env.PAYTR_INSTALLMENT_TABLE_TOKEN?.trim();
  if (override) {
    return override;
  }

  const merchantId = process.env.PAYTR_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYTR_MERCHANT_KEY?.trim();
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT?.trim();
  if (!merchantId || !merchantKey || !merchantSalt) {
    return null;
  }

  return buildPaytrInstallmentTableToken({ merchantId, merchantKey, merchantSalt });
}

export function getPaytrInstallmentTableScriptUrl(amountTryCents: number): string | null {
  if (!Number.isFinite(amountTryCents) || amountTryCents <= 0) {
    return null;
  }

  const merchantId = process.env.PAYTR_MERCHANT_ID?.trim();
  const token = resolvePaytrInstallmentTableToken();
  if (!merchantId || !token) {
    return null;
  }

  return buildPaytrInstallmentTableScriptUrl({ merchantId, token, amountTryCents });
}

export function paytrHashesMatch(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
