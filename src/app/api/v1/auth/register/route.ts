import { NextResponse } from "next/server";

import { registerParentAccount } from "@/infrastructure/auth/register-parent-account";
import { logMemberActivity } from "@/infrastructure/audit/log-member-activity";
import { enforcePublicPostRateLimit } from "@/infrastructure/auth/public-post-rate-limit";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";
import { sanitizeParentAuthNextPath } from "@/shared/utils/auth-redirect";

interface RegisterRequestBody {
  fullName?: string;
  email?: string;
  password?: string;
  redirectTo?: string;
}

function sanitizeRedirectPath(path: string | undefined): string {
  return sanitizeParentAuthNextPath(path);
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

    void logMemberActivity({
      action: "member_registered",
      actorId: result.session.userId,
      actorEmail: email,
      actorName: fullName,
      metadata: {
        resent_confirmation: Boolean(result.resentConfirmation),
      },
    });

    return NextResponse.json({
      data: {
        session: result.session,
        needsEmailConfirmation: Boolean(result.needsEmailConfirmation),
        resentConfirmation: Boolean(result.resentConfirmation),
        redirectTo,
      },
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Kayıt sırasında hata oluştu.";
    console.error("[auth/register]", rawMessage);
    return NextResponse.json({ error: mapAuthErrorToTurkish(rawMessage) }, { status: 400 });
  }
}
