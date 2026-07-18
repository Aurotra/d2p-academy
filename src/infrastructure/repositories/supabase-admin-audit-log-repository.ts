import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdminAuditAction,
  AdminAuditLogRecord,
} from "@/core/domain/admin-audit-log";

interface AuditRow {
  id: string;
  action: AdminAuditAction;
  actor_email: string | null;
  reason: string | null;
  enrollment_id: string | null;
  event_id: string | null;
  event_title: string | null;
  student_id: string | null;
  student_name: string | null;
  student_email: string | null;
  certificate_code: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

function mapRow(row: AuditRow): AdminAuditLogRecord {
  const metaName =
    typeof row.metadata?.student_name === "string" ? row.metadata.student_name : null;
  const metaEvent =
    typeof row.metadata?.event_title === "string" ? row.metadata.event_title : null;

  return {
    id: row.id,
    action: row.action,
    actorEmail: row.actor_email,
    reason: row.reason,
    enrollmentId: row.enrollment_id,
    eventTitle: row.event_title || metaEvent,
    studentName: row.student_name || metaName,
    studentEmail: row.student_email,
    certificateCode: row.certificate_code,
    createdAt: new Date(row.created_at),
    metadata: row.metadata ?? {},
  };
}

export class SupabaseAdminAuditLogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(limit = 100, action?: AdminAuditAction): Promise<AdminAuditLogRecord[]> {
    let query = this.client
      .from("admin_audit_logs")
      .select(
        `
        id,
        action,
        actor_email,
        reason,
        enrollment_id,
        event_id,
        event_title,
        student_id,
        student_name,
        student_email,
        certificate_code,
        created_at,
        metadata
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq("action", action);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Denetim kayıtları alınamadı: ${error.message}`);
    }

    const rows = (data ?? []) as AuditRow[];
    const mapped = rows.map(mapRow);

    const missingStudentIds = Array.from(
      new Set(
        rows
          .filter((row) => !row.student_name && row.student_id)
          .map((row) => row.student_id as string),
      ),
    );
    const missingEventIds = Array.from(
      new Set(
        rows
          .filter((row) => !row.event_title && row.event_id)
          .map((row) => row.event_id as string),
      ),
    );

    const [profilesResult, eventsResult] = await Promise.all([
      missingStudentIds.length > 0
        ? this.client
            .from("profiles")
            .select("id, full_name, email")
            .in("id", missingStudentIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; email: string }> }),
      missingEventIds.length > 0
        ? this.client.from("events").select("id, title").in("id", missingEventIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    ]);

    const profilesById = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
    );
    const eventsById = new Map((eventsResult.data ?? []).map((event) => [event.id, event]));

    return mapped.map((log, index) => {
      const row = rows[index];
      const profile = row.student_id ? profilesById.get(row.student_id) : undefined;
      const event = row.event_id ? eventsById.get(row.event_id) : undefined;

      return {
        ...log,
        studentName: log.studentName || profile?.full_name || null,
        studentEmail: log.studentEmail || profile?.email || null,
        eventTitle: log.eventTitle || event?.title || null,
      };
    });
  }

  async logEnrollmentDeleted(input: {
    actorId: string;
    actorEmail: string | null;
    reason: string | null;
    enrollmentId: string;
    eventId: string | null;
    eventTitle: string | null;
    studentId: string | null;
    studentName: string | null;
    studentEmail: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.client.from("admin_audit_logs").insert({
      action: "enrollment_deleted",
      actor_id: input.actorId,
      actor_email: input.actorEmail,
      reason: input.reason,
      enrollment_id: input.enrollmentId,
      event_id: input.eventId,
      event_title: input.eventTitle,
      student_id: input.studentId,
      student_name: input.studentName,
      student_email: input.studentEmail,
      metadata: input.metadata ?? {},
    });

    if (error) {
      throw new Error(`Silme kaydı yazılamadı: ${error.message}`);
    }
  }
}
