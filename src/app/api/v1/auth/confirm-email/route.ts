import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  mapVerifyOtpErrorToQueryCode,
  sanitizeAuthNextPath,
} from "@/shared/utils/auth-redirect";
import { logMemberActivity } from "@/infrastructure/audit/log-member-activity";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

interface ConfirmEmailRequestBody {
  tokenHash?: string;
  type?: EmailOtpType;
  next?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ConfirmEmailRequestBody;
  const tokenHash = body.tokenHash?.trim() ?? "";
  const type = body.type;
  const next = sanitizeAuthNextPath(body.next);

  if (!tokenHash || !type) {
    return NextResponse.json({ error: "Geçersiz onay bağlantısı." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Kimlik doğrulama yapılandırması eksik." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const response = NextResponse.json({ data: { redirectTo: next } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    const queryCode = mapVerifyOtpErrorToQueryCode(error.message);
    return NextResponse.json(
      { error: mapAuthErrorToTurkish(queryCode === "otp_expired" ? "otp_expired" : error.message) },
      { status: 400 },
    );
  }

  const { error: profileError } = await supabase.rpc("ensure_user_profile");
  if (profileError) {
    console.error("[confirm-email] ensure_user_profile", profileError.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    void logMemberActivity({
      action: "email_confirmed",
      actorId: user.id,
      actorEmail: user.email ?? null,
      actorName:
        typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    });
  }

  return response;
}
