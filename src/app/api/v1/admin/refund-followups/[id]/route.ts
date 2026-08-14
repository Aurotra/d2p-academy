import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminApiServiceClient } from "@/infrastructure/auth/get-admin-api-service-client";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";
import { apiCatchResponse, logSupabaseError } from "@/shared/utils/api-error";

const patchSchema = z.object({
  status: z.enum(["refunded_manual", "waived"]),
  note: z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAdminApiServiceClient();
  if (access.response) return access.response;

  try {
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "status refunded_manual veya waived olmalı." },
        { status: 400 },
      );
    }

    const { data: existing, error: fetchError } = await access.client
      .from("refund_followups")
      .select(
        `
        id,
        status,
        enrollment_id,
        event_id,
        student_id,
        amount_try_cents,
        provider_payment_id,
        provider,
        events ( title ),
        student:profiles!refund_followups_student_id_fkey ( full_name, email )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      logSupabaseError("[admin/refund-followups PATCH fetch]", fetchError);
      return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
    }

    if (existing.status !== "open") {
      return NextResponse.json(
        { error: "Bu takip zaten çözülmüş.", data: { id: existing.id, status: existing.status } },
        { status: 409 },
      );
    }

    const resolvedAt = new Date().toISOString();
    const note = parsed.data.note?.trim() || null;

    const { data: updated, error: updateError } = await access.client
      .from("refund_followups")
      .update({
        status: parsed.data.status,
        resolved_at: resolvedAt,
        resolved_by: access.user.id,
        note,
      })
      .eq("id", id)
      .eq("status", "open")
      .select("id, status, resolved_at, resolved_by, note")
      .maybeSingle();

    if (updateError || !updated) {
      if (updateError) {
        logSupabaseError("[admin/refund-followups PATCH]", updateError);
      }
      return NextResponse.json({ error: "Takip güncellenemedi." }, { status: 400 });
    }

    const event = Array.isArray(existing.events) ? existing.events[0] : existing.events;
    const student = Array.isArray(existing.student) ? existing.student[0] : existing.student;

    try {
      const audit = new SupabaseAdminAuditLogRepository(access.client);
      await audit.logRefundFollowupResolved({
        actorId: access.user.id,
        actorEmail: access.actorEmail,
        reason: note,
        followupId: updated.id,
        eventId: existing.event_id,
        eventTitle: event?.title ?? null,
        studentId: existing.student_id,
        studentName: student?.full_name ?? null,
        studentEmail: student?.email ?? null,
        enrollmentId: existing.enrollment_id,
        metadata: {
          status: updated.status,
          amount_try_cents: existing.amount_try_cents,
          provider: existing.provider,
          provider_payment_id: existing.provider_payment_id,
        },
      });
    } catch (auditError) {
      console.error("[admin/refund-followups PATCH audit]", auditError);
    }

    revalidatePath("/admin/refund-followups");
    revalidatePath("/admin");

    return NextResponse.json({ data: updated });
  } catch (error) {
    return apiCatchResponse(error, "Takip güncellenemedi.", {
      logLabel: "[admin/refund-followups PATCH]",
      status: 500,
    });
  }
}
