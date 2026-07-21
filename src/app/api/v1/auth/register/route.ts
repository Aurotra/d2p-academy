import { NextResponse } from "next/server";

import { registerParentAccount } from "@/infrastructure/auth/register-parent-account";
import { enforcePublicPostRateLimit } from "@/infrastructure/auth/public-post-rate-limit";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

interface RegisterRequestBody {
  fullName?: string;
  email?: string;
  password?: string;
  redirectTo?: string;
}

function sanitizeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export async function POST(request: Request) {
  try {
    const rateLimited = await enforcePublicPostRateLimit(request, "auth-register");
    if (rateLimited) {
      return rateLimited;
    }

    const body = (await request.json()) as RegisterRequestBody;
    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const redirectTo = sanitizeRedirectPath(body.redirectTo);

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Ad soyad, e-posta ve şifre zorunludur." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    const result = await registerParentAccount({ fullName, email, password, redirectTo });

    return NextResponse.json({
      data: {
        session: result.session,
        needsEmailConfirmation: Boolean(result.needsEmailConfirmation),
        resentConfirmation: Boolean(result.resentConfirmation),
        redirectTo,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt sırasında hata oluştu.";
    return NextResponse.json({ error: mapAuthErrorToTurkish(message) }, { status: 400 });
  }
}
