import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export type EnrollmentActor =
  | { ok: true; actorId: string; client: SupabaseClient; via: "email" | "student" }
  | { ok: false; response: NextResponse };

/**
 * Email Auth user OR username-student JWT. Student path uses service_role
 * after ownership is checked in the repository via actorId.
 */
export async function resolveEnrollmentActor(): Promise<EnrollmentActor> {
  const serverClient = await createSupabaseServerClient();
  if (!serverClient) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Supabase yapılandırması bulunamadı." },
        { status: 500 },
      ),
    };
  }

  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (user) {
    return { ok: true, actorId: user.id, client: serverClient, via: "email" };
  }

  const studentSession = await getStudentSession();
  if (!studentSession) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 }),
    };
  }

  try {
    const service = createServiceRoleClient();
    return {
      ok: true,
      actorId: studentSession.sub,
      client: service,
      via: "student",
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sunucu yapılandırması eksik (service role)." },
        { status: 500 },
      ),
    };
  }
}
