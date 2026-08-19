import { timingSafeEqual } from "node:crypto";

function readBearerSecret(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return request.headers.get("x-cron-secret")?.trim() || null;
}

function secretsEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function authorizeCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return false;
  }
  const provided = readBearerSecret(request);
  return Boolean(provided) && secretsEqual(provided as string, expected);
}
