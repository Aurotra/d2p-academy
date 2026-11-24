import { NextResponse } from "next/server";

import type { Profile } from "@/core/domain/auth";
import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function requireInstructorApiAccess(): Promise<
  | {
      client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
      profile: Profile;
      response?: never;
    }
  | { client?: never; profile?: never; response: NextResponse }
> {
  const client = await createSupabaseServerClient();

  if (!client) {
    return {
      response: NextResponse.json({ error: "Supabase yapılandırması bulunamadı." }, { status: 500 }),
    };
  }

  const access = await getInstructorAccess(client);

  if (!access.authorized) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    const message =
      access.reason === "unauthenticated"
        ? "Bu işlem için giriş yapmalısınız."
        : "Bu işlem için eğitmen yetkisi gereklidir.";

    return { response: NextResponse.json({ error: message }, { status }) };
  }

  return { client, profile: access.profile };
}
