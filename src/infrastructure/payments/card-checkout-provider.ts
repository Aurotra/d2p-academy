import "server-only";

import { isIyzicoConfigured } from "@/infrastructure/payments/iyzico-client";
import { isPaytrConfigured } from "@/infrastructure/payments/paytr-client";

export type CardCheckoutProvider = "paytr" | "iyzico";

export function resolveCardCheckoutProvider(): CardCheckoutProvider {
  const explicit = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (explicit === "paytr" || explicit === "iyzico") {
    return explicit;
  }
  if (isPaytrConfigured()) {
    return "paytr";
  }
  return "iyzico";
}

export function isCardCheckoutConfigured(): boolean {
  const provider = resolveCardCheckoutProvider();
  return provider === "paytr" ? isPaytrConfigured() : isIyzicoConfigured();
}
