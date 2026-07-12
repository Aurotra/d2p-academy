import { NextResponse } from "next/server";

import { signInWithEmail } from "@/core/use-cases/authenticate-user";
import { SupabaseAuthRepository } from "@/infrastructure/repositories/supabase-auth-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const email = body.email?.trim() ?? "";
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

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Giriş sırasında hata oluştu.";
    return NextResponse.json({ error: mapAuthErrorToTurkish(message) }, { status: 401 });
  }
}
