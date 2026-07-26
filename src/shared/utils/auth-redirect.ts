import type { EmailOtpType } from "@supabase/supabase-js";

import { SITE_URL } from "@/shared/constants/site";

export function sanitizeAuthNextPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export function buildEmailConfirmationUrl(input: {
  tokenHash: string;
  type: EmailOtpType;
  nextPath?: string | null;
}): string {
  const next = sanitizeAuthNextPath(input.nextPath);
  const url = new URL("/auth/confirm", SITE_URL);
  url.searchParams.set("token_hash", input.tokenHash);
  url.searchParams.set("type", input.type);
  url.searchParams.set("next", next);
  return url.toString();
}

export function mapVerifyOtpErrorToQueryCode(message: string): "otp_expired" | "auth" {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("invalid") ||
    normalized.includes("already been used")
  ) {
    return "otp_expired";
  }

  return "auth";
}
