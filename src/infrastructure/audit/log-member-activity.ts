import "server-only";

import type { MemberActivityAction } from "@/core/domain/admin-audit-log";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function logMemberActivity(input: {
  action: MemberActivityAction;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  eventId?: string | null;
  eventTitle?: string | null;
  enrollmentId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const client = createServiceRoleClient();

    await client.from("admin_audit_logs").insert({
      action: input.action,
      actor_id: input.actorId ?? null,
      actor_email: input.actorEmail ?? null,
      student_id: input.studentId ?? null,
      student_name: input.studentName ?? input.actorName ?? null,
      student_email: input.studentEmail ?? null,
      event_id: input.eventId ?? null,
      event_title: input.eventTitle ?? null,
      enrollment_id: input.enrollmentId ?? null,
      metadata: {
        source: "member_activity",
        ...(input.actorName ? { actor_name: input.actorName } : {}),
        ...input.metadata,
      },
    });
  } catch (error) {
    console.error("[log-member-activity]", input.action, error);
  }
}
