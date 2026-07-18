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
  event_title: string | null;
  student_name: string | null;
  student_email: string | null;
  certificate_code: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

function mapRow(row: AuditRow): AdminAuditLogRecord {
  return {
    id: row.id,
    action: row.action,
    actorEmail: row.actor_email,
    reason: row.reason,
    enrollmentId: row.enrollment_id,
    eventTitle: row.event_title,
    studentName: row.student_name,
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
        event_title,
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

    return ((data ?? []) as AuditRow[]).map(mapRow);
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
