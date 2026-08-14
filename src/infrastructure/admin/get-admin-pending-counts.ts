import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminPendingCounts {
  registrations: number;
  institutionRequests: number;
  courseDemandRequests: number;
  refundFollowupsOpen: number;
  programsMissingDuration: number;
  programsMissingDurationCodes: string[];
}

export async function getAdminPendingCounts(
  client: SupabaseClient,
): Promise<AdminPendingCounts> {
  const [
    registrationsResult,
    institutionRequestsResult,
    courseDemandResult,
    refundFollowupsResult,
    programsResult,
  ] = await Promise.all([
      client
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "yeni"),
      client
        .from("institution_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "yeni"),
      client
        .from("course_demand_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      client
        .from("refund_followups")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      client
        .from("programs")
        .select("program_code, duration_weeks, duration_hours")
        .eq("is_active", true),
    ]);

  const programsMissingDuration = (programsResult.data ?? []).filter(
    (program) => program.duration_weeks == null && program.duration_hours == null,
  );

  return {
    registrations: registrationsResult.count ?? 0,
    institutionRequests: institutionRequestsResult.count ?? 0,
    courseDemandRequests: courseDemandResult.count ?? 0,
    refundFollowupsOpen: refundFollowupsResult.count ?? 0,
    programsMissingDuration: programsMissingDuration.length,
    programsMissingDurationCodes: programsMissingDuration.map(
      (program) => program.program_code as string,
    ),
  };
}
