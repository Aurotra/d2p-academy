-- D2P Academy | Migration 040
-- Track form reminder emails to avoid duplicate sends.

create table if not exists public.form_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  reminder_type text not null check (reminder_type in ('day_after_enrollment', 'before_event')),
  recipient_email text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  constraint form_reminder_logs_enrollment_type_unique unique (enrollment_id, reminder_type)
);

create index if not exists form_reminder_logs_enrollment_id_idx
  on public.form_reminder_logs (enrollment_id);

alter table public.form_reminder_logs enable row level security;

-- Only service role / migrations should touch this table.
revoke all on table public.form_reminder_logs from public, anon, authenticated;
