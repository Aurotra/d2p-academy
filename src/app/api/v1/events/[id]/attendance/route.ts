import { NextResponse } from "next/server";

import type { AttendanceStatus } from "@/core/domain/event-attendance";
import { getEventAttendanceAccess } from "@/infrastructure/auth/get-event-attendance-access";
import { logAttendanceMarked } from "@/infrastructure/audit/log-attendance-marked";
import { SupabaseEventAttendanceRepository } from "@/infrastructure/repositories/supabase-event-attendance-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

interface AttendanceRequestBody {
  enrollmentId?: string;
  sessionId?: string;
  status?: AttendanceStatus;
  notes?: string | null;
}

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "excused"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await context.params;
  const client = await createSupabaseServerClient();

  if (!client) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const access = await getEventAttendanceAccess(client, eventId);
  if (!access.authorized) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ error: "Bu etkinlik için yoklama yetkiniz yok." }, { status });
  }

  const body = (await request.json()) as AttendanceRequestBody;
  const enrollmentId = body.enrollmentId?.trim() ?? "";
  const sessionId = body.sessionId?.trim() ?? "";
  const status = body.status;

  if (!enrollmentId || !sessionId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Geçersiz yoklama verisi." }, { status: 400 });
  }

  try {
    const repository = new SupabaseEventAttendanceRepository(client);
    const result = await repository.upsertAttendance(eventId, access.userId, {
      enrollmentId,
      sessionId,
      status,
      notes: body.notes ?? null,
    });

    const { data: actorProfile } = await client
      .from("profiles")
      .select("full_name, email")
      .eq("id", access.userId)
      .maybeSingle();

    void logAttendanceMarked({
      actorId: access.userId,
      actorEmail: actorProfile?.email ?? null,
      actorName: actorProfile?.full_name ?? null,
      actorRole: access.role,
      eventId,
      eventTitle: result.eventTitle,
      enrollmentId,
      studentId: result.studentId,
      studentName: result.studentName,
      studentEmail: result.studentEmail,
      sessionId,
      sessionLabel: result.sessionLabel,
      status: result.status,
      previousStatus: result.previousStatus,
      outsideEventWindow: result.outsideEventWindow,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yoklama kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
