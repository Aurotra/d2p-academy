const PAYTR_TOKEN_MAX_AGE_MS = 2 * 60 * 1000;

export function paytrEmbedUrl(paymentId: string): string {
  return `/odeme/${paymentId}?embed=1&fresh=1`;
}

export function shouldRotatePaytrCheckout(input: {
  status: string;
  provider: string;
  createdAt: string;
  isFreshLoad: boolean;
}): boolean {
  if (input.status !== "pending" || input.provider !== "paytr") {
    return false;
  }
  const ageMs = Date.now() - new Date(input.createdAt).getTime();
  if (Number.isNaN(ageMs) || ageMs > PAYTR_TOKEN_MAX_AGE_MS) {
    return true;
  }
  return !input.isFreshLoad;
}
