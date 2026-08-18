export const HAVALE_PAYMENT_PROVIDER = "havale";

const CARD_PROVIDERS = new Set(["iyzico", "paytr"]);

export function isCardPaymentProvider(provider: string | null | undefined): boolean {
  if (provider == null || provider.trim() === "") {
    return true;
  }
  return CARD_PROVIDERS.has(provider.trim().toLowerCase());
}

export function isHavalePaymentProvider(provider: string | null | undefined): boolean {
  return provider?.trim().toLowerCase() === HAVALE_PAYMENT_PROVIDER;
}

export function parseTryLiraToCents(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const lira = Number(normalized);
  if (!Number.isFinite(lira)) {
    return null;
  }
  const cents = Math.round(lira * 100);
  return cents > 0 ? cents : null;
}

export function resolveHavaleAmountTryCents(input: {
  overrideTryCents: number | null | undefined;
  eventPriceTryCents: number | null | undefined;
}): number {
  if (input.overrideTryCents != null && input.overrideTryCents > 0) {
    return input.overrideTryCents;
  }
  if (input.eventPriceTryCents != null && input.eventPriceTryCents > 0) {
    return input.eventPriceTryCents;
  }
  throw new Error("Havale tutarı girin veya etkinlikte bir kurs ücreti tanımlı olsun.");
}
