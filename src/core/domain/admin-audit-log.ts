export type AdminAuditAction =
  | "enrollment_deleted"
  | "enrollment_removed_from_event"
  | "certificate_revoked"
  | "instructor_granted"
  | "instructor_revoked"
  | "member_registered"
  | "email_confirmed"
  | "child_profile_created"
  | "child_profile_updated"
  | "course_demand_submitted"
  | "institution_request_submitted"
  | "enrollment_created"
  | "intake_form_submitted"
  | "attendance_marked"
  | "refund_followup_resolved";

export const MEMBER_ACTIVITY_ACTIONS = [
  "member_registered",
  "email_confirmed",
  "child_profile_created",
  "child_profile_updated",
  "course_demand_submitted",
  "institution_request_submitted",
  "enrollment_created",
  "intake_form_submitted",
] as const satisfies readonly AdminAuditAction[];

export type MemberActivityAction = (typeof MEMBER_ACTIVITY_ACTIONS)[number];

export function isMemberActivityAction(action: AdminAuditAction): action is MemberActivityAction {
  return (MEMBER_ACTIVITY_ACTIONS as readonly string[]).includes(action);
}

export function isAttendanceAction(action: AdminAuditAction): boolean {
  return action === "attendance_marked";
}

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
  enrollment_removed_from_event: "Kurstan çıkarıldı",
  certificate_revoked: "Sertifika iptal",
  instructor_granted: "Eğitmen yetkisi verildi",
  instructor_revoked: "Eğitmen yetkisi alındı",
  member_registered: "Veli kaydı",
  email_confirmed: "E-posta onayı",
  child_profile_created: "Çocuk eklendi",
  child_profile_updated: "Profil güncellendi",
  course_demand_submitted: "Kurs talebi",
  institution_request_submitted: "Kurum formu",
  enrollment_created: "Etkinlik kaydı",
  intake_form_submitted: "Tanıma formu",
  attendance_marked: "Yoklama işaretlendi",
  refund_followup_resolved: "İade takibi çözüldü",
};
