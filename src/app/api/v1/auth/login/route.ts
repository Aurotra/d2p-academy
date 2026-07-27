import { NextResponse } from "next/server";

import { signInWithEmail } from "@/core/use-cases/authenticate-user";
import { isAuthEmailAwaitingConfirmation } from "@/infrastructure/auth/check-auth-email-awaiting-confirmation";
import { clearStudentSessionCookie } from "@/infrastructure/auth/clear-student-session-cookie";
import { SupabaseAuthRepository } from "@/infrastructure/repositories/supabase-auth-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

function isInvalidLoginCredentialsMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")
  );
}

export async function POST(request: Request) {
  let email = "";

  try {
    const body = (await request.json()) as LoginRequestBody;
    email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
    }

    const client = await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json(
        { error: "Supabase yapılandırması bulunamadı. .env.local dosyanızı kontrol edin." },
        { status: 500 },
      );
    }

    const repository = new SupabaseAuthRepository(client);
    const result = await signInWithEmail(repository, { email, password });

    const response = NextResponse.json({ data: result });
    clearStudentSessionCookie(response);
    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Giriş sırasında hata oluştu.";

    if (isInvalidLoginCredentialsMessage(rawMessage)) {
      const awaitingConfirmation = await isAuthEmailAwaitingConfirmation(email);
      if (awaitingConfirmation) {
        return NextResponse.json(
          { error: mapAuthErrorToTurkish("email not confirmed") },
          { status: 401 },
        );
      }
    }

    const message = mapAuthErrorToTurkish(rawMessage);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
