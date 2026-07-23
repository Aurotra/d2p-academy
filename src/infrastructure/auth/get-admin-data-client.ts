import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

/**
 * Admin paneli veri sorguları için service role client döner.
 * Önce oturum + admin yetkisi doğrulanır; RLS kaynaklı eksik kolon/rol sorunlarını önler.
 */
export async function getAdminDataClient(): Promise<SupabaseClient> {
  const sessionClient = await createSupabaseServerClient();

  if (!sessionClient) {
    redirect("/login");
  }

  const access = await getAdminAccess(sessionClient);
  if (!access.authorized) {
    redirect("/login");
  }

  return createServiceRoleClient();
}
