import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentStatus } from "@/core/domain/payment";
import {
  filterPaymentsOwnedByParent,
  PARENT_PAYMENTS_LIST_LIMIT,
  type ParentPaymentListItem,
} from "@/core/domain/parent-payments";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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
 */
export async function fetchParentPayments(
  client: SupabaseClient,
  parentUserId: string,
): Promise<ParentPaymentListItem[]> {
  const { data, error } = await client
    .from("payments")
    .select(
      `
      id,
      payer_user_id,
      amount_try_cents,
      status,
      paid_at,
      created_at,
      events ( title ),
      student:profiles!payments_student_user_id_fkey ( full_name )
    `,
    )
    .eq("payer_user_id", parentUserId)
    .order("created_at", { ascending: false })
    .limit(PARENT_PAYMENTS_LIST_LIMIT);

  if (error) {
    throw new Error(`Ödemeler alınamadı: ${error.message}`);
  }

  const mapped = (data ?? []).map((row) => {
    const event = unwrapOne(row.events as { title?: string } | { title?: string }[] | null);
    const student = unwrapOne(
      row.student as { full_name?: string } | { full_name?: string }[] | null,
    );

    return {
      id: row.id as string,
      payerUserId: row.payer_user_id as string,
      eventTitle: event?.title?.trim() || "Etkinlik",
      studentName: student?.full_name?.trim() || "Öğrenci",
      amountTryCents: row.amount_try_cents as number,
      status: asPaymentStatus(String(row.status)),
      paidAt: (row.paid_at as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });

  return filterPaymentsOwnedByParent(mapped, parentUserId).map(
    ({ payerUserId: _payerUserId, ...item }) => item,
  );
}
