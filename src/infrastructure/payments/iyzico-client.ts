import "server-only";

import Iyzipay from "iyzipay";

import { formatTryCentsAsIyzicoPrice } from "@/core/domain/payment";
import { SITE_URL } from "@/shared/constants/site";

export interface IyzicoBuyerInput {
  id: string;
  name: string;
  surname: string;
  email: string;
  gsmNumber?: string | null;
  ip: string;
  city?: string | null;
}

export interface IyzicoCheckoutInitInput {
  conversationId: string;
  priceTryCents: number;
  basketId: string;
  basketItemId: string;
  basketItemName: string;
  buyer: IyzicoBuyerInput;
  callbackUrl: string;
}

export interface IyzicoCheckoutInitResult {
  token: string;
  paymentPageUrl: string | null;
  checkoutFormContent: string | null;
}

export interface IyzicoCheckoutRetrieveResult {
  status: string;
  paymentStatus: string | null;
  paymentId: string | null;
  paidPrice: string | null;
  raw: Record<string, unknown>;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Ödeme yapılandırması eksik: ${name}`);
  }
  return value;
}

export function isIyzicoConfigured(): boolean {
  return Boolean(
    process.env.IYZICO_API_KEY?.trim() && process.env.IYZICO_SECRET_KEY?.trim(),
  );
}

function createIyzipayClient(): Iyzipay {
  return new Iyzipay({
    apiKey: requireEnv("IYZICO_API_KEY"),
    secretKey: requireEnv("IYZICO_SECRET_KEY"),
    uri: process.env.IYZICO_BASE_URL?.trim() || "https://sandbox-api.iyzipay.com",
  });
}

function splitFullName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { name: "Veli", surname: "Kullanici" };
  }
  if (parts.length === 1) {
    return { name: parts[0]!, surname: parts[0]! };
  }
  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1]!,
  };
}

function promisifyCreate(
  client: Iyzipay,
  request: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(
      request as never,
      (err: Error | null, result: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((result ?? {}) as Record<string, unknown>);
      },
    );
  });
}

function promisifyRetrieve(
  client: Iyzipay,
  request: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve(
      request as never,
      (err: Error | null, result: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((result ?? {}) as Record<string, unknown>);
      },
    );
  });
}

export async function initializeIyzicoCheckout(
  input: IyzicoCheckoutInitInput,
): Promise<IyzicoCheckoutInitResult> {
  const client = createIyzipayClient();
  const price = formatTryCentsAsIyzicoPrice(input.priceTryCents);
  const { name, surname } = splitFullName(`${input.buyer.name} ${input.buyer.surname}`.trim());

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: input.conversationId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: input.basketId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: input.buyer.id,
      name: input.buyer.name || name,
      surname: input.buyer.surname || surname,
      gsmNumber: input.buyer.gsmNumber?.trim() || "+905555555555",
      email: input.buyer.email,
      identityNumber: "11111111111",
      registrationAddress: "Denizli",
      ip: input.buyer.ip || "85.34.78.112",
      city: input.buyer.city?.trim() || "Denizli",
      country: "Turkey",
    },
    shippingAddress: {
      contactName: `${input.buyer.name} ${input.buyer.surname}`.trim(),
      city: input.buyer.city?.trim() || "Denizli",
      country: "Turkey",
      address: "Denizli",
    },
    billingAddress: {
      contactName: `${input.buyer.name} ${input.buyer.surname}`.trim(),
      city: input.buyer.city?.trim() || "Denizli",
      country: "Turkey",
      address: "Denizli",
    },
    basketItems: [
      {
        id: input.basketItemId,
        name: input.basketItemName.slice(0, 200),
        category1: "Egitim",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price,
      },
    ],
  };

  const result = await promisifyCreate(client, request);
  if (result.status !== "success") {
    const message =
      typeof result.errorMessage === "string" && result.errorMessage
        ? result.errorMessage
        : "iyzico ödeme formu başlatılamadı.";
    throw new Error(message);
  }

  const token = typeof result.token === "string" ? result.token : "";
  if (!token) {
    throw new Error("iyzico token alınamadı.");
  }

  return {
    token,
    paymentPageUrl:
      typeof result.paymentPageUrl === "string" ? result.paymentPageUrl : null,
    checkoutFormContent:
      typeof result.checkoutFormContent === "string" ? result.checkoutFormContent : null,
  };
}

export async function retrieveIyzicoCheckout(
  token: string,
  conversationId?: string,
): Promise<IyzicoCheckoutRetrieveResult> {
  const client = createIyzipayClient();
  const result = await promisifyRetrieve(client, {
    locale: Iyzipay.LOCALE.TR,
    conversationId: conversationId ?? undefined,
    token,
  });

  return {
    status: String(result.status ?? ""),
    paymentStatus:
      typeof result.paymentStatus === "string" ? result.paymentStatus : null,
    paymentId: result.paymentId != null ? String(result.paymentId) : null,
    paidPrice: result.paidPrice != null ? String(result.paidPrice) : null,
    raw: result,
  };
}

export function buildPaymentCallbackUrl(): string {
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}/api/v1/payments/iyzico/callback`;
}
