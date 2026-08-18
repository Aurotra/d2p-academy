import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentStatus } from "@/core/domain/payment";
import {
  classifyAdminPaymentMethod,
  isStuckCardPayment,
  resolvePaymentProviderRef,
  type AdminPaymentLedgerRow,
  type AdminPaymentMethodFilter,
  type AdminPaymentStatusFilter,
  type AdminPaymentsView,
} from "@/infrastructure/payments/admin-payment-ledger";
import { CONFIRMED_SEAT_STATUSES } from "@/infrastructure/enrollments/event-enrollment-finance-summary";

const LEDGER_LIMIT = 200;

type ProfileSnippet = {
  id: string;
  full_name: string | null;
  email: string | null;
  parent_id?: string | null;
  parent_phone: string | null;
  username?: string | null;
};

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

export async function fetchAdminPaymentLedger(
  client: SupabaseClient,
  input: {
    method: AdminPaymentMethodFilter;
    status: AdminPaymentStatusFilter;
    view: AdminPaymentsView;
    nowMs?: number;
  },
): Promise<{ rows: AdminPaymentLedgerRow[]; stuckCount: number }> {
  const paymentRows = await fetchPaymentRows(client);
  const kurumRows =
    input.method === "card" || input.method === "havale" || input.view === "stuck"
      ? []
      : await fetchKurumEnrollmentRows(client, paymentRows);

  const combined = [...paymentRows, ...kurumRows].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  const stuckCount = combined.filter((row) => row.isStuck).length;
  const filtered = combined.filter((row) => {
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

  return { rows: filtered, stuckCount };
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

async function fetchPaymentRows(client: SupabaseClient): Promise<AdminPaymentLedgerRow[]> {
  const { data, error } = await client
    .from("payments")
    .select(
      "id, enrollment_id, event_id, payer_user_id, student_user_id, amount_try_cents, provider, status, provider_payment_id, provider_conversation_id, paid_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(LEDGER_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return [];
  }

  const eventIds = [...new Set(rows.map((row) => row.event_id as string))];
  const enrollmentIds = [...new Set(rows.map((row) => row.enrollment_id as string))];
  const profileIds = [
    ...new Set(
      rows.flatMap((row) => [row.student_user_id as string, row.payer_user_id as string]),
    ),
  ];

  const [eventsResult, enrollmentsResult, profilesResult] = await Promise.all([
    client.from("events").select("id, title, payment_mode").in("id", eventIds),
    client.from("enrollments").select("id, status").in("id", enrollmentIds),
    client
      .from("profiles")
      .select("id, full_name, email, parent_id, parent_phone, username")
      .in("id", profileIds),
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);
  if (profilesResult.error) throw new Error(profilesResult.error.message);

  const eventsById = new Map((eventsResult.data ?? []).map((event) => [event.id, event]));
  const enrollmentsById = new Map(
    (enrollmentsResult.data ?? []).map((enrollment) => [enrollment.id, enrollment]),
  );
  const profilesById = new Map(
    ((profilesResult.data ?? []) as ProfileSnippet[]).map((profile) => [profile.id, profile]),
  );

  const parentIds = [
    ...new Set(
      [...profilesById.values()]
        .map((profile) => profile.parent_id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ].filter((id) => !profilesById.has(id));

  if (parentIds.length > 0) {
    const { data: parents, error: parentError } = await client
      .from("profiles")
      .select("id, full_name, email, parent_phone, username")
      .in("id", parentIds);
    if (parentError) throw new Error(parentError.message);
    for (const parent of (parents ?? []) as ProfileSnippet[]) {
      profilesById.set(parent.id, parent);
    }
  }

  return rows.map((row) => {
    const event = eventsById.get(row.event_id as string);
    const enrollment = enrollmentsById.get(row.enrollment_id as string);
    const student = profilesById.get(row.student_user_id as string);
    const payer = profilesById.get(row.payer_user_id as string);
    const parent = student?.parent_id ? profilesById.get(student.parent_id) : undefined;
    const method = classifyAdminPaymentMethod({
      provider: row.provider as string | null,
      eventPaymentMode: event?.payment_mode as string | null,
    });
    const enrollmentStatus = String(enrollment?.status ?? "pending_payment");
    const status = asStatus(String(row.status));

    return {
      id: row.id as string,
      kind: "payment",
      method,
      status,
      amountTryCents: row.amount_try_cents as number,
      studentName: displayName(student, "Öğrenci"),
      studentEmail: student?.email ?? null,
      parentName: displayName(parent ?? payer, "Veli"),
      parentEmail: parent?.email ?? payer?.email ?? null,
      parentPhone: parent?.parent_phone ?? student?.parent_phone ?? payer?.parent_phone ?? null,
      eventId: row.event_id as string,
      eventTitle: event?.title?.trim() || "Etkinlik",
      enrollmentId: row.enrollment_id as string,
      enrollmentStatus,
      provider: String(row.provider ?? "paytr"),
      providerRef: resolvePaymentProviderRef({
        provider: row.provider as string | null,
        providerPaymentId: row.provider_payment_id as string | null,
        providerConversationId: row.provider_conversation_id as string | null,
      }),
      createdAt: row.created_at as string,
      paidAt: (row.paid_at as string | null) ?? null,
      isStuck: isStuckCardPayment({
        method,
        paymentStatus: status,
        enrollmentStatus,
        createdAt: row.created_at as string,
      }),
    };
  });
}

async function fetchKurumEnrollmentRows(
  client: SupabaseClient,
  paymentRows: AdminPaymentLedgerRow[],
): Promise<AdminPaymentLedgerRow[]> {
  const paidEnrollmentIds = new Set(
    paymentRows.filter((row) => row.status === "paid").map((row) => row.enrollmentId),
  );

  const { data, error } = await client
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
    .order("registered_at", { ascending: false })
    .limit(LEDGER_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const enrollments = (data ?? []).filter(
    (row) => !paidEnrollmentIds.has(row.id as string),
  );
  if (enrollments.length === 0) {
    return [];
  }

  const studentIds = [...new Set(enrollments.map((row) => row.user_id as string))];
  const { data: students, error: studentError } = await client
    .from("profiles")
    .select("id, full_name, email, parent_id, parent_phone, username")
    .in("id", studentIds);
  if (studentError) throw new Error(studentError.message);

  const studentsById = new Map(
    ((students ?? []) as ProfileSnippet[]).map((profile) => [profile.id, profile]),
  );
  const parentIds = [
    ...new Set(
      [...studentsById.values()]
        .map((profile) => profile.parent_id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const parentsById = new Map<string, ProfileSnippet>();
  if (parentIds.length > 0) {
    const { data: parents, error: parentError } = await client
      .from("profiles")
      .select("id, full_name, email, parent_phone, username")
      .in("id", parentIds);
    if (parentError) throw new Error(parentError.message);
    for (const parent of (parents ?? []) as ProfileSnippet[]) {
      parentsById.set(parent.id, parent);
    }
  }

  return enrollments.map((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    const student = studentsById.get(row.user_id as string);
    const parent = student?.parent_id ? parentsById.get(student.parent_id) : undefined;
    const enrollmentStatus = String(row.status);
    const status: PaymentStatus =
      enrollmentStatus === "pending_payment" ? "pending" : "paid";

    return {
      id: `kurum:${row.id as string}`,
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
      eventId: row.event_id as string,
      eventTitle: event?.title?.trim() || "Etkinlik",
      enrollmentId: row.id as string,
      enrollmentStatus,
      provider: "kurum",
      providerRef: null,
      createdAt: row.registered_at as string,
      paidAt: enrollmentStatus === "pending_payment" ? null : (row.registered_at as string),
      isStuck: false,
    };
  });
}
