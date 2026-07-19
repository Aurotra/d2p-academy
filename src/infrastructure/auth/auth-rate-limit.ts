import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Durable rate limit via auth_rate_limits table (service role).
 * Returns true when the key is currently blocked.
 */
export async function isAuthRateLimited(
  client: SupabaseClient,
  rateKey: string,
): Promise<boolean> {
  const now = Date.now();
  const { data: row } = await client
    .from("auth_rate_limits")
    .select("attempt_count, window_started_at")
    .eq("rate_key", rateKey)
    .maybeSingle();

  if (!row) {
    await client.from("auth_rate_limits").upsert({
      rate_key: rateKey,
      attempt_count: 1,
      window_started_at: new Date(now).toISOString(),
    });
    return false;
  }

  const windowStart = new Date(row.window_started_at).getTime();
  if (Number.isNaN(windowStart) || now - windowStart > WINDOW_MS) {
    await client.from("auth_rate_limits").upsert({
      rate_key: rateKey,
      attempt_count: 1,
      window_started_at: new Date(now).toISOString(),
    });
    return false;
  }

  const nextCount = (row.attempt_count ?? 0) + 1;
  await client
    .from("auth_rate_limits")
    .update({ attempt_count: nextCount })
    .eq("rate_key", rateKey);

  return nextCount > MAX_ATTEMPTS;
}

export async function clearAuthRateLimit(
  client: SupabaseClient,
  rateKey: string,
): Promise<void> {
  await client.from("auth_rate_limits").delete().eq("rate_key", rateKey);
}
