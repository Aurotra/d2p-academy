export const CSP_NONCE_HEADER = "x-nonce";

export function createCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
