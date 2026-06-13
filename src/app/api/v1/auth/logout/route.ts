import { NextResponse } from "next/server";

import { signOutUser } from "@/core/use-cases/authenticate-user";
import { SupabaseAuthRepository } from "@/infrastructure/repositories/supabase-auth-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function POST() {
  try {
    const client = await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json(
        { error: "Supabase yapılandırması bulunamadı." },
        { status: 500 },
      );
    }

    const repository = new SupabaseAuthRepository(client);
    await signOutUser(repository);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Çıkış sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
