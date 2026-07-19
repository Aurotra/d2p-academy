import { NextResponse } from "next/server";

import { clearStudentSessionCookie } from "@/infrastructure/auth/clear-student-session-cookie";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function POST() {
  try {
    const client = await createSupabaseServerClient();
    if (client) {
      await client.auth.signOut();
    }
  } catch {
    // Still clear student cookie even if email sign-out fails.
  }

  const response = NextResponse.json({ success: true });
  clearStudentSessionCookie(response);
  return response;
}
