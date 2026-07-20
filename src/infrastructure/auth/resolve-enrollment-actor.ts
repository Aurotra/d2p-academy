import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export type EnrollmentActor =
  | {
      ok: true;
      actorId: string;
      client: SupabaseClient;
      via: "email" | "student" | "parent";
    }
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

/**
 * Resolve actor for a specific enrollment.
 * Parents may act as their child (service_role + child actorId) after ownership checks.
 */
export async function resolveEnrollmentActorForEnrollment(
  enrollmentId: string,
): Promise<EnrollmentActor> {
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
    let service: SupabaseClient;
    try {
      service = createServiceRoleClient();
    } catch {
      // Fall back to self-only path without parent proxy
      return { ok: true, actorId: user.id, client: serverClient, via: "email" };
    }

    const { data: enrollment, error } = await service
      .from("enrollments")
      .select("id, user_id")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (error || !enrollment) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 }),
      };
    }

    if (enrollment.user_id === user.id) {
      return { ok: true, actorId: user.id, client: serverClient, via: "email" };
    }

    const { data: child, error: childError } = await serverClient
      .from("profiles")
      .select("id")
      .eq("id", enrollment.user_id)
      .eq("parent_id", user.id)
      .eq("role", "student")
      .not("username", "is", null)
      .maybeSingle();

    if (childError) {
      console.error("[resolveEnrollmentActorForEnrollment]", childError.message);
      return {
        ok: false,
        response: NextResponse.json({ error: "Yetki kontrolü başarısız." }, { status: 500 }),
      };
    }

    if (!child) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Bu kayıt için işlem yapma yetkiniz yok." },
          { status: 403 },
        ),
      };
    }

    return {
      ok: true,
      actorId: enrollment.user_id,
      client: service,
      via: "parent",
    };
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
