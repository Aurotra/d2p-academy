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
import { fetchAdminPaymentLedger } from "@/infrastructure/payments/fetch-admin-payment-ledger";
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

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; method?: string; status?: string }>;
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

  const client = await getAdminDataClient();
  let rows: AdminPaymentLedgerRow[] = [];
  let stuckCount = 0;
  let loadError: string | null = null;

  try {
    const ledger = await fetchAdminPaymentLedger(client, { method, status, view });
    rows = ledger.rows;
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
          Kart, havale ve kurum kayıtları tek listede. Sağlayıcı no / dekont mutabakat içindir.
          Takılı kart kuyruğu 45 dakikayı geçen veya başarısız PayTR denemelerini gösterir.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : (
        <AdminPaymentsManager
          rows={rows}
          stuckCount={stuckCount}
          view={view}
          method={method}
          status={status}
        />
      )}
    </div>
  );
}
