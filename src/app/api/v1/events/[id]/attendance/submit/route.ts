import { NextResponse } from "next/server";

import type { AttendanceStatus } from "@/core/domain/event-attendance";
import { getEventAttendanceAccess } from "@/infrastructure/auth/get-event-attendance-access";
import { logAttendanceSubmitted } from "@/infrastructure/audit/log-attendance-submitted";
import { SupabaseEventAttendanceRepository } from "@/infrastructure/repositories/supabase-event-attendance-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { apiCatchResponse } from "@/shared/utils/api-error";

interface SubmitAttendanceRequestBody {
  sessionId?: string;
  marks?: Array<{
    enrollmentId?: string;
    status?: AttendanceStatus;
  }>;
}

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "excused"];

export async function POST(
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

  const body = (await request.json()) as SubmitAttendanceRequestBody;
  const sessionId = body.sessionId?.trim() ?? "";
  const marks = body.marks ?? [];

  if (!sessionId || marks.length === 0) {
    return NextResponse.json({ error: "Geçersiz yoklama verisi." }, { status: 400 });
  }

  const normalizedMarks = marks
    .map((mark) => ({
      enrollmentId: mark.enrollmentId?.trim() ?? "",
      status: mark.status,
    }))
    .filter((mark) => mark.enrollmentId);

  if (normalizedMarks.some((mark) => !mark.status || !VALID_STATUSES.includes(mark.status))) {
    return NextResponse.json({ error: "Geçersiz yoklama durumu." }, { status: 400 });
  }

  try {
    const repository = new SupabaseEventAttendanceRepository(client);
    const result = await repository.submitSessionAttendance(
      eventId,
      access.userId,
      {
        sessionId,
        marks: normalizedMarks as Array<{ enrollmentId: string; status: AttendanceStatus }>,
      },
      { allowLockedSession: access.role === "admin" },
    );

    const { data: actorProfile } = await client
      .from("profiles")
      .select("full_name, email")
      .eq("id", access.userId)
      .maybeSingle();

    void logAttendanceSubmitted({
      actorId: access.userId,
      actorEmail: actorProfile?.email ?? null,
      actorName: actorProfile?.full_name ?? null,
      actorRole: access.role,
      eventId,
      eventTitle: result.eventTitle,
      sessionId,
      sessionLabel: result.sessionLabel,
      studentCount: result.studentCount,
      outsideEventWindow: result.outsideEventWindow,
    });

    return NextResponse.json({ ok: true, submittedAt: new Date().toISOString() });
  } catch (error) {
    return apiCatchResponse(error, "Yoklama onaylanamadı.", {
      logLabel: "[attendance/submit]",
      status: 400,
    });
  }
}
