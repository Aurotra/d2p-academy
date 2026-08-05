import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  mapVerifyOtpErrorToQueryCode,
  sanitizeParentAuthNextPath,
} from "@/shared/utils/auth-redirect";

function getRedirectOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV === "development") {
    return requestUrl.origin;
  }

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return requestUrl.origin;
}

function redirectTo(request: Request, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, getRedirectOrigin(request)));
}

function authCallbackHashFallbackResponse(): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Yönlendiriliyor…</title>
</head>
<body>
  <p>Yönlendiriliyor…</p>
  <script>
    (function () {
      var hash = window.location.hash || "";
      var params = new URLSearchParams(hash.replace(/^#/, ""));

      if (params.get("access_token")) {
        window.location.replace("/login" + (window.location.search || "") + hash);
        return;
      }

      var errorCode = params.get("error_code") || params.get("error");
      if (errorCode) {
        window.location.replace("/login?error=" + encodeURIComponent(errorCode));
        return;
      }

      window.location.replace("/login?error=auth");
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeParentAuthNextPath(requestUrl.searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectTo(request, "/login?error=auth");
  }

  if (!code && !(tokenHash && type)) {
    return authCallbackHashFallbackResponse();
  }

  if (tokenHash && type) {
    const confirmUrl = new URL("/auth/confirm", getRedirectOrigin(request));
    confirmUrl.searchParams.set("token_hash", tokenHash);
    confirmUrl.searchParams.set("type", type);
    confirmUrl.searchParams.set("next", next);
    return NextResponse.redirect(confirmUrl);
  }

  const cookieStore = await cookies();
  const redirectResponse = redirectTo(request, next);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession", error.message);
      const queryCode = mapVerifyOtpErrorToQueryCode(error.message);
      return redirectTo(request, `/login?error=${queryCode}`);
    }
  }

  const { error: profileError } = await supabase.rpc("ensure_user_profile");
  if (profileError) {
    console.error("[auth/callback] ensure_user_profile", profileError.message);
  }

  return redirectResponse;
}
