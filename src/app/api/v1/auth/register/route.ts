import { NextResponse } from "next/server";

import { signUpWithEmail } from "@/core/use-cases/authenticate-user";
import { SupabaseAuthRepository } from "@/infrastructure/repositories/supabase-auth-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

interface RegisterRequestBody {
  fullName?: string;
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Ad soyad, e-posta ve şifre zorunludur." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    const client = await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json(
        { error: "Supabase yapılandırması bulunamadı. .env.local dosyanızı kontrol edin." },
        { status: 500 },
      );
    }

    const repository = new SupabaseAuthRepository(client);
    const result = await signUpWithEmail(repository, { fullName, email, password });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
