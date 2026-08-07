-- D2P Academy | Migration 068
-- Kurstan çıkarma işlemi için audit log action türü

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_action_check;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_action_check
  check (action in (
    'enrollment_deleted',
    'enrollment_removed_from_event',
    'certificate_revoked',
    'instructor_granted',
    'instructor_revoked',
    'member_registered',
    'email_confirmed',
    'child_profile_created',
    'child_profile_updated',
    'course_demand_submitted',
    'institution_request_submitted',
    'enrollment_created',
    'intake_form_submitted',
    'attendance_marked'
  ));
