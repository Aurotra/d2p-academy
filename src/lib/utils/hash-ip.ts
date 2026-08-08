import { createHash } from "node:crypto";

/** One-way hash for audit logs (certificate verification, consent IP fields). */
export function hashClientIp(ip: string | null | undefined): string | null {
  if (!ip) {
    return null;
  }

  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
