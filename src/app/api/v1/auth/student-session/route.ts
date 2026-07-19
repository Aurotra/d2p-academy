import { NextResponse } from "next/server";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

/** Lightweight session probe for site header (no progress payload). */
export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ data: { authenticated: false } });
  }

  try {
    const client = createServiceRoleClient();
    const { data } = await client
      .from("profiles")
      .select("full_name, username")
      .eq("id", session.sub)
      .maybeSingle();

    return NextResponse.json({
      data: {
        authenticated: true,
        fullName: data?.full_name ?? session.username,
        username: data?.username ?? session.username,
      },
    });
  } catch {
    return NextResponse.json({
      data: {
        authenticated: true,
        fullName: session.username,
        username: session.username,
      },
    });
  }
}
