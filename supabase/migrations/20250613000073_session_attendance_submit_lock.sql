-- D2P Academy | Migration 073
-- Ders yoklaması onaya gönderildikten sonra kilitlenir.

alter table public.event_sessions
  add column if not exists attendance_submitted_at timestamptz,
  add column if not exists attendance_submitted_by uuid references public.profiles (id) on delete set null;

create index if not exists event_sessions_attendance_submitted_at_idx
  on public.event_sessions (attendance_submitted_at)
  where attendance_submitted_at is not null;

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
    'attendance_marked',
    'attendance_submitted'
  ));
