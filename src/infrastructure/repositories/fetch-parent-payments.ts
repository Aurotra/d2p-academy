import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentStatus } from "@/core/domain/payment";
import {
  filterPaymentsOwnedByParent,
  PARENT_PAYMENTS_LIST_LIMIT,
  type ParentPaymentListItem,
} from "@/core/domain/parent-payments";

function asPaymentStatus(value: string): PaymentStatus {
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

/**
 * Loads payments where the authenticated parent is the payer.
 * Always filters by payer_user_id = parentUserId (never by student alone).
 * Event/student names are loaded separately so a relationship/RLS embed error
 * cannot blank the whole payments page.
 */
export async function fetchParentPayments(
  client: SupabaseClient,
  parentUserId: string,
): Promise<ParentPaymentListItem[]> {
  const { data, error } = await client
    .from("payments")
    .select(
      "id, payer_user_id, student_user_id, event_id, amount_try_cents, status, paid_at, created_at",
    )
    .eq("payer_user_id", parentUserId)
    .order("created_at", { ascending: false })
    .limit(PARENT_PAYMENTS_LIST_LIMIT);

  if (error) {
    throw new Error(`Ödemeler alınamadı: ${error.message}`);
  }

  const rows = data ?? [];
  const eventIds = [...new Set(rows.map((row) => row.event_id as string).filter(Boolean))];
  const studentIds = [...new Set(rows.map((row) => row.student_user_id as string).filter(Boolean))];

  const [eventsResult, studentsResult] = await Promise.all([
    eventIds.length > 0
      ? client.from("events").select("id, title").in("id", eventIds)
      : Promise.resolve({ data: [] as { id: string; title: string | null }[], error: null }),
    studentIds.length > 0
      ? client.from("profiles").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[], error: null }),
  ]);

  const eventTitleById = new Map(
    (eventsResult.data ?? []).map((event) => [event.id, event.title?.trim() || "Etkinlik"]),
  );
  const studentNameById = new Map(
    (studentsResult.data ?? []).map((profile) => [
      profile.id,
      profile.full_name?.trim() || "Öğrenci",
    ]),
  );

  const mapped = rows.map((row) => ({
    id: row.id as string,
    payerUserId: row.payer_user_id as string,
    eventTitle: eventTitleById.get(row.event_id as string) ?? "Etkinlik",
    studentName: studentNameById.get(row.student_user_id as string) ?? "Öğrenci",
    amountTryCents: row.amount_try_cents as number,
    status: asPaymentStatus(String(row.status)),
    paidAt: (row.paid_at as string | null) ?? null,
    createdAt: row.created_at as string,
  }));

  return filterPaymentsOwnedByParent(mapped, parentUserId).map(
    ({ payerUserId: _payerUserId, ...item }) => item,
  );
}
