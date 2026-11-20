-- Track whether admin was emailed for an enrollment so PayTR/iyzico retries
-- can safely re-attempt delivery without duplicate spam.
alter table public.enrollments
  add column if not exists admin_notified_at timestamptz;

comment on column public.enrollments.admin_notified_at is
  'Set when admin enrollment notification email was successfully sent.';

create index if not exists enrollments_admin_notified_at_idx
  on public.enrollments (admin_notified_at)
  where admin_notified_at is null;
