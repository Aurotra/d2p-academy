import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getAdminDataClient } from "@/infrastructure/auth/get-admin-data-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import type {
  AdminPaymentLedgerRow,
  AdminPaymentMethodFilter,
  AdminPaymentStatusFilter,
  AdminPaymentsView,
} from "@/infrastructure/payments/admin-payment-ledger";
import {
  EMPTY_ADMIN_PAYMENT_LEDGER_SUMMARY,
  adminPaymentLedgerCsvFilename,
  type AdminPaymentLedgerSummary,
} from "@/infrastructure/payments/admin-payment-ledger-summary";
import { fetchAdminPaymentLedger } from "@/infrastructure/payments/fetch-admin-payment-ledger";
import {
  istanbulYmd,
  resolveAdminReportRange,
  type AdminReportPeriodPreset,
} from "@/infrastructure/reports/admin-report-period";
import { AdminPaymentsManager } from "@/presentation/components/admin/admin-payments-manager";

export const dynamic = "force-dynamic";

function parseMethod(value: string | undefined): AdminPaymentMethodFilter {
  if (value === "card" || value === "havale" || value === "kurum") {
    return value;
  }
  return "all";
}

function parseStatus(value: string | undefined): AdminPaymentStatusFilter {
  if (
    value === "paid" ||
    value === "pending" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return "all";
}

function parsePeriod(value: string | undefined): AdminReportPeriodPreset {
  if (
    value === "last_3_months" ||
    value === "last_12_months" ||
    value === "custom" ||
    value === "this_month"
  ) {
    return value;
  }
  return "this_month";
}

function istanbulInputDate(date: Date): string {
  const { year, month, day } = istanbulYmd(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    method?: string;
    status?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
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
  const view: AdminPaymentsView = params.view === "stuck" ? "stuck" : "ledger";
  const method = parseMethod(params.method);
  const status = parseStatus(params.status);
  const period = parsePeriod(params.period);

  let periodError: string | null = null;
  let range = resolveAdminReportRange({ preset: "this_month" });
  try {
    range = resolveAdminReportRange({
      preset: period,
      from: params.from,
      to: params.to,
    });
  } catch (error) {
    periodError = error instanceof Error ? error.message : "Tarih aralığı geçersiz.";
    range = resolveAdminReportRange({ preset: "this_month" });
  }

  const client = await getAdminDataClient();
  let rows: AdminPaymentLedgerRow[] = [];
  let summary: AdminPaymentLedgerSummary = EMPTY_ADMIN_PAYMENT_LEDGER_SUMMARY;
  let stuckCount = 0;
  let loadError: string | null = null;

  try {
    const ledger = await fetchAdminPaymentLedger(client, { method, status, view, range });
    rows = ledger.rows;
    summary = ledger.summary;
    stuckCount = ledger.stuckCount;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Ödemeler yüklenemedi.";
    console.error("[admin/payments page]", error);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Finans
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-950">Ödemeler</h1>
        <p className="mt-2 text-sm text-muted">
          Dönem: {range.label} (Europe/Istanbul). Kart ve havale hesaba geçen tahsilat; kurum
          okul tahsilatı tahmini. Mutabakat bu dönem özetinden biter.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <AdminPaymentsManager
          rows={rows}
          summary={summary}
          stuckCount={stuckCount}
          view={view}
          method={method}
          status={status}
          period={range.preset}
          from={params.from ?? istanbulInputDate(range.startInclusive)}
          to={params.to ?? istanbulInputDate(new Date(range.endExclusive.getTime() - 1))}
          rangeLabel={range.label}
          csvFilename={adminPaymentLedgerCsvFilename(range)}
          periodError={periodError}
        />
      )}
    </div>
  );
}
