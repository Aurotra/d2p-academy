export type AdminAuditAction = "enrollment_deleted" | "certificate_revoked";

export interface AdminAuditLogRecord {
  id: string;
  action: AdminAuditAction;
  actorEmail: string | null;
  reason: string | null;
  enrollmentId: string | null;
  eventTitle: string | null;
  studentName: string | null;
  studentEmail: string | null;
  certificateCode: string | null;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export const ADMIN_AUDIT_ACTION_LABELS: Record<AdminAuditAction, string> = {
  enrollment_deleted: "Kayıt silindi",
  certificate_revoked: "Sertifika iptal",
};
