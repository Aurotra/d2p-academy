import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function sanitizeNextPath(nextParam: string | null): string {
  const next = nextParam ?? "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

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
      var params = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
      var errorCode = params.get("error_code") || params.get("error") || "auth";
      window.location.replace("/login?error=" + encodeURIComponent(errorCode));
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
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectTo(request, "/login?error=auth");
  }

  if (!code && !(tokenHash && type)) {
    return authCallbackHashFallbackResponse();
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
      return redirectTo(request, "/login?error=auth");
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[auth/callback] verifyOtp", error.message);
      return redirectTo(request, "/login?error=auth");
    }
  }

  const { error: profileError } = await supabase.rpc("ensure_user_profile");
  if (profileError) {
    console.error("[auth/callback] ensure_user_profile", profileError.message);
  }

  return redirectResponse;
}
