import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function sanitizeNextPath(nextParam: string | null): string {
  const next = nextParam ?? "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
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
    return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
  }

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
  }

  const cookieStore = await cookies();
  const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin));

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
      return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[auth/callback] verifyOtp", error.message);
      return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
    }
  }

  const { error: profileError } = await supabase.rpc("ensure_user_profile");
  if (profileError) {
    console.error("[auth/callback] ensure_user_profile", profileError.message);
  }

  return redirectResponse;
}
