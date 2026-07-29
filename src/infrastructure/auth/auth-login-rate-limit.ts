import "server-only";

import { NextResponse } from "next/server";

import {
  clearAuthRateLimit,
  isAuthRateLimited,
} from "@/infrastructure/auth/auth-rate-limit";
import { tryCreateServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { getClientIp } from "@/lib/utils/request-ip";

const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function buildLoginRateKey(request: Request, identifier: string): string {
  const ip = getClientIp(request) ?? "unknown";
  return `parent-login:${ip}:${identifier.trim().toLowerCase()}`;
}

/**
 * Returns a 429 response when rate-limited; null when allowed.
 * If service role is unavailable, allows the request (fail-open).
 */
export async function enforceParentLoginRateLimit(
  request: Request,
  email: string,
): Promise<NextResponse | null> {
  const client = tryCreateServiceRoleClient();
  if (!client) {
    return null;
  }

  const rateKey = buildLoginRateKey(request, email);
  const blocked = await isAuthRateLimited(client, rateKey, {
    maxAttempts: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (blocked) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  return null;
}

export async function clearParentLoginRateLimit(
  request: Request,
  email: string,
): Promise<void> {
  const client = tryCreateServiceRoleClient();
  if (!client) {
    return;
  }

  await clearAuthRateLimit(client, buildLoginRateKey(request, email));
}
