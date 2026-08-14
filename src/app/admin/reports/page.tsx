import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getAdminDataClient } from "@/infrastructure/auth/get-admin-data-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { resolveAdminReportRange } from "@/infrastructure/reports/admin-report-period";
import { fetchAdminReports } from "@/infrastructure/reports/fetch-admin-reports";
import {
  AdminReportsClient,
  type AdminReportsTab,
} from "@/presentation/components/admin/admin-reports-client";

export const dynamic = "force-dynamic";

function istanbulInputDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string; from?: string; to?: string }>;
}) {
  const sessionClient = await createSupabaseServerClient();
  if (!sessionClient) {
    redirect("/login");
  }

  const access = await getAdminAccess(sessionClient);
  if (!access.authorized) {
    redirect("/login");
  }

  const params = await searchParams;
  const tab: AdminReportsTab = params.tab === "source" ? "source" : "overview";
  const preset =
    params.period === "last_3_months" ||
    params.period === "last_12_months" ||
    params.period === "custom" ||
    params.period === "this_month"
      ? params.period
      : "this_month";

  let periodError: string | null = null;
  let range = resolveAdminReportRange({ preset: "this_month" });
  try {
    range = resolveAdminReportRange({
      preset,
      from: params.from,
      to: params.to,
    });
  } catch (error) {
    periodError = error instanceof Error ? error.message : "Tarih aralığı geçersiz.";
    range = resolveAdminReportRange({ preset: "this_month" });
  }

  const client = await getAdminDataClient();
  const reports = await fetchAdminReports(client, range);
  const overview = {
    iyzicoCollectedTryCents: reports.overview.iyzicoCollectedTryCents,
    previousIyzicoCollectedTryCents: reports.overview.previousIyzicoCollectedTryCents,
    iyzicoTrendPct: reports.overview.iyzicoTrendPct,
    externalEstimateTryCents: reports.overview.externalEstimateTryCents,
    enrollmentCount: reports.overview.enrollmentCount,
    cancelledCount: reports.overview.cancelledCount,
    cancelRatePct: reports.overview.cancelRatePct,
    hardDeletedCount: reports.overview.hardDeletedCount,
    openRefundFollowupCount: reports.overview.openRefundFollowupCount,
    popularEvents: reports.overview.popularEvents,
  };

  return (
    <AdminReportsClient
      tab={tab}
      preset={range.preset}
      from={params.from ?? istanbulInputDate(range.startInclusive)}
      to={params.to ?? istanbulInputDate(new Date(range.endExclusive.getTime() - 1))}
      rangeLabel={range.label}
      overview={overview}
      sourceTrend={reports.sourceTrend}
      periodError={periodError}
    />
  );
}
