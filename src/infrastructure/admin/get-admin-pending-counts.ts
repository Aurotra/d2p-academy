import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminPendingCounts {
  registrations: number;
  institutionRequests: number;
}

export async function getAdminPendingCounts(
  client: SupabaseClient,
): Promise<AdminPendingCounts> {
  const [registrationsResult, institutionRequestsResult] = await Promise.all([
    client
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("status", "yeni"),
    client
      .from("institution_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "yeni"),
  ]);

  return {
    registrations: registrationsResult.count ?? 0,
    institutionRequests: institutionRequestsResult.count ?? 0,
  };
}
