import "server-only";

import { formatTryCentsAsIyzicoPrice } from "@/core/domain/payment";
import { SITE_URL } from "@/shared/constants/site";

import {
  buildPaytrGetTokenHash,
  buildPaytrNotificationHash,
  encodePaytrBasket,
  merchantOidFromPaymentId,
  paytrHashesMatch,
} from "@/infrastructure/payments/paytr-hash";

const PAYTR_GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export interface PaytrCheckoutInitInput {
  paymentId: string;
  priceTryCents: number;
  eventTitle: string;
  buyer: {
    name: string;
    email: string;
    phone?: string | null;
    ip: string;
  };
}

export interface PaytrCheckoutInitResult {
  token: string;
  iframeUrl: string;
  merchantOid: string;
}

export interface PaytrNotification {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
  failedReasonCode?: string;
  failedReasonMsg?: string;
  raw: Record<string, string>;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Ödeme yapılandırması eksik: ${name}`);
  }
  return value;
}

export function isPaytrConfigured(): boolean {
  return Boolean(
    process.env.PAYTR_MERCHANT_ID?.trim() &&
      process.env.PAYTR_MERCHANT_KEY?.trim() &&
      process.env.PAYTR_MERCHANT_SALT?.trim(),
  );
}

export function isPaytrTestMode(): boolean {
  const value = process.env.PAYTR_TEST_MODE?.trim();
  return value !== "0" && value !== "false";
}

function siteBase(): string {
  return SITE_URL.replace(/\/$/, "");
}

export function buildPaytrNotificationUrl(): string {
  return `${siteBase()}/api/v1/payments/paytr/callback`;
}

export function buildPaytrOkUrl(paymentId: string): string {
  return `${siteBase()}/odeme/basarili?paymentId=${encodeURIComponent(paymentId)}`;
}

export function buildPaytrFailUrl(paymentId: string): string {
  return `${siteBase()}/odeme/basarisiz?paymentId=${encodeURIComponent(paymentId)}`;
}

function asciiEmail(email: string): string {
  const trimmed = email.trim().slice(0, 100);
  const ascii = trimmed.replace(/[^\x00-\x7F]/g, "");
  return ascii || "veli@d2p.com.tr";
}

function digitsPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "").slice(0, 20);
  return digits || "05555555555";
}

export async function initializePaytrCheckout(
  input: PaytrCheckoutInitInput,
): Promise<PaytrCheckoutInitResult> {
  const merchantId = requireEnv("PAYTR_MERCHANT_ID");
  const merchantKey = requireEnv("PAYTR_MERCHANT_KEY");
  const merchantSalt = requireEnv("PAYTR_MERCHANT_SALT");
  const merchantOid = merchantOidFromPaymentId(input.paymentId);
  const paymentAmount = String(input.priceTryCents);
  const unitPrice = formatTryCentsAsIyzicoPrice(input.priceTryCents);
  const userBasket = encodePaytrBasket(input.eventTitle, unitPrice);
  const noInstallment = "1";
  const maxInstallment = "0";
  const currency = "TL";
  const testMode = isPaytrTestMode() ? "1" : "0";
  const email = asciiEmail(input.buyer.email);
  const userIp = input.buyer.ip.trim() || "85.34.78.112";

  const paytrToken = buildPaytrGetTokenHash({
    merchantId,
    userIp,
    merchantOid,
    email,
    paymentAmount,
    userBasket,
    noInstallment,
    maxInstallment,
    currency,
    testMode,
    merchantSalt,
    merchantKey,
  });

  const body = new URLSearchParams({
    merchant_id: merchantId,
    merchant_key: merchantKey,
    merchant_salt: merchantSalt,
    email,
    payment_amount: paymentAmount,
    merchant_oid: merchantOid,
    user_name: input.buyer.name.trim().slice(0, 60) || "Veli",
    user_address: "Denizli",
    user_phone: digitsPhone(input.buyer.phone),
    merchant_ok_url: buildPaytrOkUrl(input.paymentId),
    merchant_fail_url: buildPaytrFailUrl(input.paymentId),
    user_basket: userBasket,
    user_ip: userIp,
    timeout_limit: "30",
    debug_on: testMode,
    test_mode: testMode,
    lang: "tr",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    currency,
    iframe_v2: "1",
    paytr_token: paytrToken,
  });

  const response = await fetch(PAYTR_GET_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const rawText = await response.text();
  let parsed: { status?: string; token?: string; reason?: string } = {};
  try {
    parsed = JSON.parse(rawText) as { status?: string; token?: string; reason?: string };
  } catch {
    throw new Error("PayTR yanıtı okunamadı.");
  }

  if (parsed.status !== "success" || !parsed.token) {
    throw new Error(parsed.reason || "PayTR ödeme formu başlatılamadı.");
  }

  return {
    token: parsed.token,
    iframeUrl: `https://www.paytr.com/odeme/guvenli/${parsed.token}`,
    merchantOid,
  };
}

export function parsePaytrNotification(form: URLSearchParams): PaytrNotification {
  const raw: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    raw[key] = value;
  }

  return {
    merchantOid: form.get("merchant_oid")?.trim() ?? "",
    status: form.get("status")?.trim() ?? "",
    totalAmount: form.get("total_amount")?.trim() ?? "",
    hash: form.get("hash")?.trim() ?? "",
    failedReasonCode: form.get("failed_reason_code")?.trim() || undefined,
    failedReasonMsg: form.get("failed_reason_msg")?.trim() || undefined,
    raw,
  };
}

export function verifyPaytrNotification(notification: PaytrNotification): boolean {
  if (!notification.merchantOid || !notification.hash) {
    return false;
  }

  const expected = buildPaytrNotificationHash({
    merchantOid: notification.merchantOid,
    merchantSalt: requireEnv("PAYTR_MERCHANT_SALT"),
    status: notification.status,
    totalAmount: notification.totalAmount,
    merchantKey: requireEnv("PAYTR_MERCHANT_KEY"),
  });

  return paytrHashesMatch(expected, notification.hash);
}
