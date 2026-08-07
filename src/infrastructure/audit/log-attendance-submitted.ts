import "server-only";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function logAttendanceSubmitted(input: {
  actorId: string;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole: "admin" | "instructor";
  eventId: string;
  eventTitle: string;
  sessionId: string;
  sessionLabel: string;
  studentCount: number;
  outsideEventWindow: boolean;
}): Promise<void> {
  try {
    const client = createServiceRoleClient();

    await client.from("admin_audit_logs").insert({
      action: "attendance_submitted",
      actor_id: input.actorId,
      actor_email: input.actorEmail ?? null,
      event_id: input.eventId,
      event_title: input.eventTitle,
      metadata: {
        source: "attendance",
        actor_name: input.actorName ?? null,
        actor_role: input.actorRole,
        session_id: input.sessionId,
        session_label: input.sessionLabel,
        student_count: input.studentCount,
        outside_event_window: input.outsideEventWindow,
      },
    });
  } catch (error) {
    console.error("[log-attendance-submitted]", error);
  }
}
