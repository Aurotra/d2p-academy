import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildAdminReportOverview,
  buildAdminReportSourceTrend,
  type AdminReportEnrollmentRow,
  type AdminReportEventRow,
  type AdminReportOverview,
  type AdminReportPaymentRow,
  type AdminReportSourceTrend,
} from "@/infrastructure/reports/build-admin-reports";
import {
  previousEqualRange,
  type AdminReportRange,
} from "@/infrastructure/reports/admin-report-period";

const PAGE_SIZE = 1000;

type EventQueryRow = {
  id: string;
  title: string;
  payment_mode: string | null;
  is_paid: boolean | null;
  display_price_try_cents: number | null;
};

export type AdminReportsPayload = {
  overview: AdminReportOverview;
  sourceTrend: AdminReportSourceTrend;
};

export async function fetchAdminReports(
  client: SupabaseClient,
  range: AdminReportRange,
): Promise<AdminReportsPayload> {
  const startIso = range.startInclusive.toISOString();
  const endIso = range.endExclusive.toISOString();
  const paymentRangeStart = previousEqualRange(range).startInclusive.toISOString();

  const [enrollments, payments, eventsResult, hardDeleted, openRefunds] = await Promise.all([
    fetchPagedEnrollments(client, startIso, endIso),
    fetchPagedPayments(client, paymentRangeStart, endIso),
    client.from("events").select("id, title, payment_mode, is_paid, display_price_try_cents"),
    client
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "enrollment_deleted")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    client.from("refund_followups").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message);
  }
  if (hardDeleted.error) {
    throw new Error(hardDeleted.error.message);
  }
  if (openRefunds.error) {
    throw new Error(openRefunds.error.message);
  }

  const eventRows: AdminReportEventRow[] = ((eventsResult.data ?? []) as EventQueryRow[]).map(
    (row) => ({
      id: row.id,
      title: row.title,
      paymentMode: row.payment_mode,
      isPaid: row.is_paid,
      displayPriceTryCents: row.display_price_try_cents,
    }),
  );

  const overview = buildAdminReportOverview({
    range,
    enrollments,
    payments,
    events: eventRows,
    hardDeletedCount: hardDeleted.count ?? 0,
    openRefundFollowupCount: openRefunds.count ?? 0,
  });

  return {
    overview,
    sourceTrend: buildAdminReportSourceTrend(enrollments, range),
  };
}

async function fetchPagedEnrollments(
  client: SupabaseClient,
  startIso: string,
  endIso: string,
): Promise<AdminReportEnrollmentRow[]> {
  const rows: AdminReportEnrollmentRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from("enrollments")
      .select("event_id, status, enrollment_source, registered_at")
      .gte("registered_at", startIso)
      .lt("registered_at", endIso)
      .order("registered_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    for (const row of page) {
      rows.push({
        eventId: row.event_id as string,
        status: String(row.status),
        enrollmentSource: (row.enrollment_source as string | null) ?? null,
        registeredAt: row.registered_at as string,
      });
    }

    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return rows;
}

async function fetchPagedPayments(
  client: SupabaseClient,
  startIso: string,
  endIso: string,
): Promise<AdminReportPaymentRow[]> {
  const byId = new Map<string, AdminReportPaymentRow>();

  const collect = (
    rows: Array<{
      id: string;
      amount_try_cents: number;
      paid_at: string | null;
      created_at: string;
      provider: string | null;
    }>,
  ) => {
    for (const row of rows) {
      byId.set(row.id, {
        amountTryCents: row.amount_try_cents,
        paidAt: row.paid_at,
        createdAt: row.created_at,
        provider: row.provider,
      });
    }
  };

  let from = 0;
  while (true) {
    const { data, error } = await client
      .from("payments")
      .select("id, amount_try_cents, paid_at, created_at, provider")
      .eq("status", "paid")
      .gte("paid_at", startIso)
      .lt("paid_at", endIso)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }
    const page = data ?? [];
    collect(page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  from = 0;
  while (true) {
    const { data, error } = await client
      .from("payments")
      .select("id, amount_try_cents, paid_at, created_at, provider")
      .eq("status", "paid")
      .is("paid_at", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }
    const page = data ?? [];
    collect(page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return [...byId.values()];
}
