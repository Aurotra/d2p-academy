import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { apiCatchResponse, logSupabaseError } from "@/shared/utils/api-error";

const querySchema = z.object({
  status: z.enum(["open", "refunded_manual", "waived", "all"]).default("open"),
  eventId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      status: url.searchParams.get("status") ?? "open",
      eventId: url.searchParams.get("eventId") ?? undefined,
      limit: url.searchParams.get("limit") ?? 50,
      offset: url.searchParams.get("offset") ?? 0,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz sorgu." }, { status: 400 });
    }

    const { status, eventId, limit, offset } = parsed.data;

    let query = access.client
      .from("refund_followups")
      .select(
        `
        id,
        enrollment_id,
        event_id,
        student_id,
        amount_try_cents,
        provider_payment_id,
        provider,
        paid_at,
        cancelled_at,
        cancelled_by,
        reason,
        status,
        resolved_at,
        resolved_by,
        note,
        created_at,
        events ( title ),
        student:profiles!refund_followups_student_id_fkey ( full_name, email ),
        cancelled_by_profile:profiles!refund_followups_cancelled_by_fkey ( email, full_name )
      `,
        { count: "exact" },
      )
      .order("cancelled_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error, count } = await query;

    if (error) {
      logSupabaseError("[admin/refund-followups GET]", error);
      return NextResponse.json({ error: "İade takipleri alınamadı." }, { status: 400 });
    }

    const rows = (data ?? []).map((row) => {
      const event = Array.isArray(row.events) ? row.events[0] : row.events;
      const student = Array.isArray(row.student) ? row.student[0] : row.student;
      const cancelledBy = Array.isArray(row.cancelled_by_profile)
        ? row.cancelled_by_profile[0]
        : row.cancelled_by_profile;

      return {
        id: row.id,
        enrollmentId: row.enrollment_id,
        eventId: row.event_id,
        eventTitle: event?.title ?? null,
        studentId: row.student_id,
        studentName: student?.full_name ?? null,
        studentEmail: student?.email ?? null,
        amountTryCents: row.amount_try_cents,
        providerPaymentId: row.provider_payment_id,
        provider: row.provider,
        paidAt: row.paid_at,
        cancelledAt: row.cancelled_at,
        cancelledByEmail: cancelledBy?.email ?? null,
        cancelledByName: cancelledBy?.full_name ?? null,
        reason: row.reason,
        status: row.status,
        resolvedAt: row.resolved_at,
        note: row.note,
      };
    });

    return NextResponse.json({
      data: rows,
      meta: { total: count ?? rows.length, limit, offset, status },
    });
  } catch (error) {
    return apiCatchResponse(error, "İade takipleri alınamadı.", {
      logLabel: "[admin/refund-followups GET]",
      status: 500,
    });
  }
}
