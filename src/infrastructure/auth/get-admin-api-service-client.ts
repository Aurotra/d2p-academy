import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function getAdminApiServiceClient(): Promise<
  | {
      client: SupabaseClient;
      user: User;
      actorEmail: string | null;
      response?: never;
    }
  | { client?: never; user?: never; actorEmail?: never; response: NextResponse }
> {
  const sessionClient = await createSupabaseServerClient();

  if (!sessionClient) {
    return {
      response: NextResponse.json({ error: "Supabase yapılandırması bulunamadı." }, { status: 500 }),
    };
  }

  const access = await getAdminAccess(sessionClient);

  if (!access.authorized) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    const message =
      access.reason === "unauthenticated"
        ? "Bu işlem için giriş yapmalısınız."
        : "Bu işlem için admin yetkisi gereklidir.";

    return { response: NextResponse.json({ error: message }, { status }) };
  }

  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: "Giriş gerekli." }, { status: 401 }) };
  }

  const { data: actorProfile } = await sessionClient
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    client: createServiceRoleClient(),
    user,
    actorEmail: actorProfile?.email ?? user.email ?? null,
  };
}
