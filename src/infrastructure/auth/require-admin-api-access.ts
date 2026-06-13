import { NextResponse } from "next/server";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function requireAdminApiAccess(): Promise<
  | { client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>; response?: never }
  | { client?: never; response: NextResponse }
> {
  const client = await createSupabaseServerClient();

  if (!client) {
    return {
      response: NextResponse.json({ error: "Supabase yapılandırması bulunamadı." }, { status: 500 }),
    };
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    const message =
      access.reason === "unauthenticated"
        ? "Bu işlem için giriş yapmalısınız."
        : "Bu işlem için admin yetkisi gereklidir.";

    return { response: NextResponse.json({ error: message }, { status }) };
  }

  return { client };
}
