-- Üye hareketleri: mevcut admin_audit_logs tablosuna yeni action türleri

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_action_check;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_action_check
  check (action in (
    'enrollment_deleted',
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
    'intake_form_submitted'
  ));

create index if not exists admin_audit_logs_actor_id_idx
  on public.admin_audit_logs (actor_id, created_at desc)
  where actor_id is not null;
