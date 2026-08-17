type Header = { key: string; value: string };

const ALLOWED_CORS_ORIGINS = ["https://www.d2p.com.tr", "https://d2p.com.tr"] as const;

function getSupabaseCspOrigins(): { https: string; wss: string } {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return { https: "https://*.supabase.co", wss: "wss://*.supabase.co" };
  }

  try {
    const host = new URL(raw).host;
    return { https: `https://${host}`, wss: `wss://${host}` };
  } catch {
    return { https: "https://*.supabase.co", wss: "wss://*.supabase.co" };
  }
}

function shouldSendHsts(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production";
  }

  return process.env.NODE_ENV === "production";
}

/** CSP with per-request nonce — set from middleware, not next.config. */
export function buildContentSecurityPolicy(nonce: string): string {
  const supabase = getSupabaseCspOrigins();
  const isProd = process.env.NODE_ENV === "production";

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isProd ? [] : ["'unsafe-eval'"]),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self'",
    "style-src-elem 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase.https}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase.https} ${supabase.wss}`,
    "frame-src 'self' https://www.paytr.com https://www.google.com https://maps.google.com https://www.google.com.tr",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  if (isProd) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/** Static security headers (CSP is injected per request in middleware). */
export function getSecurityHeaders(): Header[] {
  const headers: Header[] = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
  ];

  if (shouldSendHsts()) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

/** Restrict cross-origin access to Next static assets. */
export function getStaticAssetCorsHeaders(): Header[] {
  return [
    { key: "Access-Control-Allow-Origin", value: ALLOWED_CORS_ORIGINS[0] },
    { key: "Vary", value: "Origin" },
  ];
}

export function applyContentSecurityPolicy(response: Response, nonce: string): void {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
}
