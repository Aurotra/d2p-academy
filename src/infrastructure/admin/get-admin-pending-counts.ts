import type { SupabaseClient } from "@supabase/supabase-js";

import {
  classifyAdminPaymentMethod,
  isStuckCardPayment,
} from "@/infrastructure/payments/admin-payment-ledger";

export interface AdminPendingCounts {
  institutionRequests: number;
  courseDemandRequests: number;
  refundFollowupsOpen: number;
  stuckCardPayments: number;
  programsMissingDuration: number;
  programsMissingDurationCodes: string[];
}

export async function getAdminPendingCounts(
  client: SupabaseClient,
): Promise<AdminPendingCounts> {
  const [
    institutionRequestsResult,
    courseDemandResult,
    refundFollowupsResult,
    stuckPaymentsResult,
    programsResult,
  ] = await Promise.all([
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
        .from("payments")
        .select("id, created_at, status, provider, enrollments!inner(status)")
        .in("status", ["pending", "failed"]),
      client
        .from("programs")
        .select("program_code, duration_weeks, duration_hours")
        .eq("is_active", true),
    ]);

  const programsMissingDuration = (programsResult.data ?? []).filter(
    (program) => program.duration_weeks == null && program.duration_hours == null,
  );

  if (stuckPaymentsResult.error) {
    console.error("[admin pending counts stuck payments]", stuckPaymentsResult.error.message);
  }

  const stuckCardPayments = stuckPaymentsResult.error
    ? 0
    : (stuckPaymentsResult.data ?? []).filter((row) => {
    const enrollment = Array.isArray(row.enrollments) ? row.enrollments[0] : row.enrollments;
    const method = classifyAdminPaymentMethod({ provider: row.provider as string | null });
    return isStuckCardPayment({
      method,
      paymentStatus: String(row.status),
      enrollmentStatus: String(
        enrollment && typeof enrollment === "object" && "status" in enrollment
          ? enrollment.status
          : "",
      ),
      createdAt: String(row.created_at),
    });
  }).length;

  return {
    institutionRequests: institutionRequestsResult.count ?? 0,
    courseDemandRequests: courseDemandResult.count ?? 0,
    refundFollowupsOpen: refundFollowupsResult.count ?? 0,
    stuckCardPayments,
    programsMissingDuration: programsMissingDuration.length,
    programsMissingDurationCodes: programsMissingDuration.map(
      (program) => program.program_code as string,
    ),
  };
}
