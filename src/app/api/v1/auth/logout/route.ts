import { NextResponse } from "next/server";

import { signOutUser } from "@/core/use-cases/authenticate-user";
import { clearStudentSessionCookie } from "@/infrastructure/auth/clear-student-session-cookie";
import { SupabaseAuthRepository } from "@/infrastructure/repositories/supabase-auth-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { apiCatchResponse } from "@/shared/utils/api-error";

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

    const response = NextResponse.json({ success: true });
    clearStudentSessionCookie(response);
    return response;
  } catch (error) {
    return apiCatchResponse(error, "Çıkış sırasında hata oluştu.", {
      logLabel: "[auth/logout]",
      status: 500,
    });
  }
}
