-- Eğitmen yetkisi verildi / alındı işlemleri için audit log action türleri

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_action_check;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_action_check
  check (action in (
    'enrollment_deleted',
    'certificate_revoked',
    'instructor_granted',
    'instructor_revoked'
  ));
