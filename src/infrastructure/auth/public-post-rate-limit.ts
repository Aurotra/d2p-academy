import "server-only";

import { NextResponse } from "next/server";

import { isAuthRateLimited } from "@/infrastructure/auth/auth-rate-limit";
import { tryCreateServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { getClientIp } from "@/lib/utils/request-ip";

/** ~20 submissions / 15 min per IP per bucket (public forms). */
const PUBLIC_MAX = 20;
const PUBLIC_WINDOW_MS = 15 * 60 * 1000;

/**
 * Returns a 429 response when rate-limited; null when allowed.
 * If service role is unavailable, allows the request (fail-open).
 */
export async function enforcePublicPostRateLimit(
  request: Request,
  bucket: string,
): Promise<NextResponse | null> {
  const client = tryCreateServiceRoleClient();
  if (!client) {
    return null;
  }

  const ip = getClientIp(request) ?? "unknown";
  const rateKey = `public:${bucket}:${ip}`;
  const blocked = await isAuthRateLimited(client, rateKey, {
    maxAttempts: PUBLIC_MAX,
    windowMs: PUBLIC_WINDOW_MS,
  });

  if (blocked) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  return null;
}
