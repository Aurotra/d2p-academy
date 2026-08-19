import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentStatus } from "@/core/domain/payment";
import { CONFIRMED_SEAT_STATUSES } from "@/infrastructure/enrollments/event-enrollment-finance-summary";
import {
  classifyAdminPaymentMethod,
  isStuckCardPayment,
  resolvePaymentProviderRef,
  type AdminPaymentLedgerRow,
  type AdminPaymentMethodFilter,
  type AdminPaymentStatusFilter,
  type AdminPaymentsView,
} from "@/infrastructure/payments/admin-payment-ledger";
import {
  EMPTY_ADMIN_PAYMENT_LEDGER_SUMMARY,
  ledgerRowInRange,
  summarizeAdminPaymentLedger,
  type AdminPaymentLedgerSummary,
} from "@/infrastructure/payments/admin-payment-ledger-summary";
import type { AdminReportRange } from "@/infrastructure/reports/admin-report-period";

const PAGE_SIZE = 1000;
const IN_CHUNK = 120;

type ProfileSnippet = {
  id: string;
  full_name: string | null;
  email: string | null;
  parent_id?: string | null;
  parent_phone: string | null;
  username?: string | null;
};

type PaymentQueryRow = {
  id: string;
  enrollment_id: string;
  event_id: string;
  payer_user_id: string;
  student_user_id: string;
  amount_try_cents: number;
  provider: string | null;
  status: string;
  provider_payment_id: string | null;
  provider_conversation_id: string | null;
  paid_at: string | null;
  created_at: string;
  stuck_warned_at: string | null;
};

const PAYMENT_COLUMNS =
  "id, enrollment_id, event_id, payer_user_id, student_user_id, amount_try_cents, provider, status, provider_payment_id, provider_conversation_id, paid_at, created_at, stuck_warned_at";

function asStatus(value: string): PaymentStatus {
  if (
    value === "paid" ||
    value === "pending" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return "pending";
}

function displayName(profile: ProfileSnippet | undefined, fallback: string): string {
  return profile?.full_name?.trim() || profile?.username?.trim() || fallback;
}

async function fetchPaged<T>(
  load: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }
  return rows;
}

async function selectIn<T>(
  ids: string[],
  load: (chunk: string[]) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out: T[] = [];
  for (let index = 0; index < unique.length; index += IN_CHUNK) {
    const { data, error } = await load(unique.slice(index, index + IN_CHUNK));
    if (error) {
      throw new Error(error.message);
    }
    out.push(...(data ?? []));
  }
  return out;
}

export async function fetchAdminPaymentLedger(
  client: SupabaseClient,
  input: {
    method: AdminPaymentMethodFilter;
    status: AdminPaymentStatusFilter;
    view: AdminPaymentsView;
    range: AdminReportRange;
    nowMs?: number;
  },
): Promise<{
  rows: AdminPaymentLedgerRow[];
  summary: AdminPaymentLedgerSummary;
  stuckCount: number;
}> {
  const [paymentRows, stuckCount] = await Promise.all([
    input.view === "stuck"
      ? fetchStuckPaymentRows(client, input.nowMs)
      : fetchPaymentRowsInRange(client, input.range, input.nowMs),
    countStuckCardPayments(client, input.nowMs),
  ]);

  const kurumRows =
    input.view === "stuck" ? [] : await fetchKurumEnrollmentRows(client, paymentRows, input.range);

  const combined = [...paymentRows, ...kurumRows].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  const periodRows =
    input.view === "stuck" ? combined : combined.filter((row) => ledgerRowInRange(row, input.range));

  const summary =
    input.view === "stuck" ? EMPTY_ADMIN_PAYMENT_LEDGER_SUMMARY : summarizeAdminPaymentLedger(periodRows);

  const rows = periodRows.filter((row) => {
    if (input.view === "stuck") {
      return row.isStuck;
    }
    if (input.method !== "all" && row.method !== input.method) {
      return false;
    }
    if (input.status !== "all" && row.status !== input.status) {
      return false;
    }
    return true;
  });

  return { rows, summary, stuckCount };
}

export async function countStuckCardPayments(
  client: SupabaseClient,
  nowMs = Date.now(),
): Promise<number> {
  const { data, error } = await client
    .from("payments")
    .select("id, created_at, status, provider, enrollments!inner(status)")
    .in("status", ["pending", "failed"]);

  if (error) {
    console.error("[admin stuck payments count]", error.message);
    return 0;
  }

  return (data ?? []).filter((row) => {
    const enrollment = Array.isArray(row.enrollments) ? row.enrollments[0] : row.enrollments;
    const method = classifyAdminPaymentMethod({ provider: row.provider as string | null });
    return isStuckCardPayment({
      method,
      paymentStatus: String(row.status),
      enrollmentStatus: String(enrollment?.status ?? ""),
      createdAt: row.created_at as string,
      nowMs,
    });
  }).length;
}

async function fetchPaymentRowsInRange(
  client: SupabaseClient,
  range: AdminReportRange,
  nowMs?: number,
): Promise<AdminPaymentLedgerRow[]> {
  const startIso = range.startInclusive.toISOString();
  const endIso = range.endExclusive.toISOString();
  const byId = new Map<string, PaymentQueryRow>();

  const created = await fetchPaged<PaymentQueryRow>(async (from, to) =>
    await client
      .from("payments")
      .select(PAYMENT_COLUMNS)
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
  for (const row of created) {
    byId.set(row.id, row);
  }

  const paid = await fetchPaged<PaymentQueryRow>(async (from, to) =>
    await client
      .from("payments")
      .select(PAYMENT_COLUMNS)
      .eq("status", "paid")
      .gte("paid_at", startIso)
      .lt("paid_at", endIso)
      .order("paid_at", { ascending: false })
      .range(from, to),
  );
  for (const row of paid) {
    byId.set(row.id, row);
  }

  return hydratePaymentRows(client, [...byId.values()], nowMs);
}

async function fetchStuckPaymentRows(
  client: SupabaseClient,
  nowMs?: number,
): Promise<AdminPaymentLedgerRow[]> {
  const rows = await fetchPaged<PaymentQueryRow>(async (from, to) =>
    await client
      .from("payments")
      .select(PAYMENT_COLUMNS)
      .in("status", ["pending", "failed"])
      .order("created_at", { ascending: false })
      .range(from, to),
  );
  return hydratePaymentRows(client, rows, nowMs);
}

async function hydratePaymentRows(
  client: SupabaseClient,
  rows: PaymentQueryRow[],
  nowMs?: number,
): Promise<AdminPaymentLedgerRow[]> {
  if (rows.length === 0) {
    return [];
  }

  const eventIds = rows.map((row) => row.event_id);
  const enrollmentIds = rows.map((row) => row.enrollment_id);
  const profileIds = rows.flatMap((row) => [row.student_user_id, row.payer_user_id]);

  const [events, enrollments, profiles] = await Promise.all([
    selectIn<{ id: string; title: string | null; payment_mode: string | null }>(eventIds, async (chunk) =>
      await client.from("events").select("id, title, payment_mode").in("id", chunk),
    ),
    selectIn<{ id: string; status: string }>(enrollmentIds, async (chunk) =>
      await client.from("enrollments").select("id, status").in("id", chunk),
    ),
    selectIn<ProfileSnippet>(profileIds, async (chunk) =>
      await client
        .from("profiles")
        .select("id, full_name, email, parent_id, parent_phone, username")
        .in("id", chunk),
    ),
  ]);

  const eventsById = new Map(events.map((event) => [event.id, event]));
  const enrollmentsById = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  const parentIds = [...profilesById.values()]
    .map((profile) => profile.parent_id?.trim())
    .filter((id): id is string => typeof id === "string" && id.length > 0 && !profilesById.has(id));

  if (parentIds.length > 0) {
    const parents = await selectIn<ProfileSnippet>(parentIds, async (chunk) =>
      await client.from("profiles").select("id, full_name, email, parent_phone, username").in("id", chunk),
    );
    for (const parent of parents) {
      profilesById.set(parent.id, parent);
    }
  }

  return rows.map((row) => {
    const event = eventsById.get(row.event_id);
    const enrollment = enrollmentsById.get(row.enrollment_id);
    const student = profilesById.get(row.student_user_id);
    const payer = profilesById.get(row.payer_user_id);
    const parent = student?.parent_id ? profilesById.get(student.parent_id) : undefined;
    const method = classifyAdminPaymentMethod({
      provider: row.provider,
      eventPaymentMode: event?.payment_mode ?? null,
    });
    const enrollmentStatus = String(enrollment?.status ?? "pending_payment");
    const status = asStatus(String(row.status));

    return {
      id: row.id,
      kind: "payment" as const,
      method,
      status,
      amountTryCents: row.amount_try_cents,
      studentName: displayName(student, "Öğrenci"),
      studentEmail: student?.email ?? null,
      parentName: displayName(parent ?? payer, "Veli"),
      parentEmail: parent?.email ?? payer?.email ?? null,
      parentPhone: parent?.parent_phone ?? student?.parent_phone ?? payer?.parent_phone ?? null,
      eventId: row.event_id,
      eventTitle: event?.title?.trim() || "Etkinlik",
      enrollmentId: row.enrollment_id,
      enrollmentStatus,
      provider: String(row.provider ?? "paytr"),
      providerRef: resolvePaymentProviderRef({
        provider: row.provider,
        providerPaymentId: row.provider_payment_id,
        providerConversationId: row.provider_conversation_id,
      }),
      createdAt: row.created_at,
      paidAt: row.paid_at,
      isStuck: isStuckCardPayment({
        method,
        paymentStatus: status,
        enrollmentStatus,
        createdAt: row.created_at,
        nowMs,
      }),
      stuckWarnedAt: (row.stuck_warned_at as string | null | undefined) ?? null,
    };
  });
}

async function fetchKurumEnrollmentRows(
  client: SupabaseClient,
  paymentRows: AdminPaymentLedgerRow[],
  range: AdminReportRange,
): Promise<AdminPaymentLedgerRow[]> {
  const paidEnrollmentIds = new Set(
    paymentRows.filter((row) => row.status === "paid").map((row) => row.enrollmentId),
  );
  const startIso = range.startInclusive.toISOString();
  const endIso = range.endExclusive.toISOString();

  const data = await fetchPaged<{
    id: string;
    status: string;
    registered_at: string;
    user_id: string;
    event_id: string;
    events:
      | { id: string; title: string | null; payment_mode: string | null; display_price_try_cents: number | null }
      | Array<{
          id: string;
          title: string | null;
          payment_mode: string | null;
          display_price_try_cents: number | null;
        }>;
  }>(async (from, to) =>
    await client
      .from("enrollments")
      .select(
        `
      id,
      status,
      registered_at,
      user_id,
      event_id,
      events!inner ( id, title, payment_mode, display_price_try_cents )
    `,
      )
      .eq("events.payment_mode", "external")
      .in("status", [...CONFIRMED_SEAT_STATUSES, "pending_payment"])
      .gte("registered_at", startIso)
      .lt("registered_at", endIso)
      .order("registered_at", { ascending: false })
      .range(from, to),
  );

  const enrollments = data.filter((row) => !paidEnrollmentIds.has(row.id));
  if (enrollments.length === 0) {
    return [];
  }

  const students = await selectIn<ProfileSnippet>(
    enrollments.map((row) => row.user_id),
    async (chunk) =>
      await client
        .from("profiles")
        .select("id, full_name, email, parent_id, parent_phone, username")
        .in("id", chunk),
  );
  const studentsById = new Map(students.map((profile) => [profile.id, profile]));
  const parentIds = [...studentsById.values()]
    .map((profile) => profile.parent_id?.trim())
    .filter((id): id is string => Boolean(id));

  const parentsById = new Map<string, ProfileSnippet>();
  if (parentIds.length > 0) {
    const parents = await selectIn<ProfileSnippet>(parentIds, async (chunk) =>
      await client.from("profiles").select("id, full_name, email, parent_phone, username").in("id", chunk),
    );
    for (const parent of parents) {
      parentsById.set(parent.id, parent);
    }
  }

  return enrollments.map((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    const student = studentsById.get(row.user_id);
    const parent = student?.parent_id ? parentsById.get(student.parent_id) : undefined;
    const enrollmentStatus = String(row.status);
    const status: PaymentStatus = enrollmentStatus === "pending_payment" ? "pending" : "paid";

    return {
      id: `kurum:${row.id}`,
      kind: "kurum_enrollment" as const,
      method: "kurum" as const,
      status,
      amountTryCents:
        typeof event?.display_price_try_cents === "number" && event.display_price_try_cents > 0
          ? event.display_price_try_cents
          : null,
      studentName: displayName(student, "Öğrenci"),
      studentEmail: student?.email ?? null,
      parentName: displayName(parent, "Veli"),
      parentEmail: parent?.email ?? null,
      parentPhone: parent?.parent_phone ?? student?.parent_phone ?? null,
      eventId: row.event_id,
      eventTitle: event?.title?.trim() || "Etkinlik",
      enrollmentId: row.id,
      enrollmentStatus,
      provider: "kurum",
      providerRef: null,
      createdAt: row.registered_at,
      paidAt: enrollmentStatus === "pending_payment" ? null : row.registered_at,
      isStuck: false,
      stuckWarnedAt: null,
    };
  });
}
