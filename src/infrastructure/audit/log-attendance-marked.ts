import "server-only";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import type { AttendanceStatus } from "@/core/domain/event-attendance";

export async function logAttendanceMarked(input: {
  actorId: string;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole: "admin" | "instructor";
  eventId: string;
  eventTitle: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  sessionId: string;
  sessionLabel: string;
  status: AttendanceStatus;
  previousStatus: AttendanceStatus | null;
  outsideEventWindow: boolean;
}): Promise<void> {
  try {
    const client = createServiceRoleClient();

    await client.from("admin_audit_logs").insert({
      action: "attendance_marked",
      actor_id: input.actorId,
      actor_email: input.actorEmail ?? null,
      student_id: input.studentId,
      student_name: input.studentName,
      student_email: input.studentEmail ?? null,
      event_id: input.eventId,
      event_title: input.eventTitle,
      enrollment_id: input.enrollmentId,
      metadata: {
        source: "attendance",
        actor_name: input.actorName ?? null,
        actor_role: input.actorRole,
        session_id: input.sessionId,
        session_label: input.sessionLabel,
        status: input.status,
        previous_status: input.previousStatus,
        outside_event_window: input.outsideEventWindow,
      },
    });
  } catch (error) {
    console.error("[log-attendance-marked]", error);
  }
}
