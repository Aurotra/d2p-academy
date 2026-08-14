-- D2P Academy | Migration 082
-- refund_followups: track paid enrollments cancelled without automatic refund.

create table if not exists public.refund_followups (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.enrollments (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  student_id uuid references public.profiles (id) on delete set null,
  amount_try_cents integer not null check (amount_try_cents > 0),
  provider_payment_id text,
  provider text not null default 'iyzico',
  paid_at timestamptz,
  cancelled_at timestamptz not null default timezone('utc', now()),
  cancelled_by uuid references public.profiles (id) on delete set null,
  reason text,
  status text not null default 'open'
    check (status in ('open', 'refunded_manual', 'waived')),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint refund_followups_resolved_consistency check (
    (status = 'open' and resolved_at is null and resolved_by is null)
    or (status in ('refunded_manual', 'waived') and resolved_at is not null)
  )
);

create index if not exists refund_followups_status_idx
  on public.refund_followups (status, cancelled_at desc);

create index if not exists refund_followups_event_id_idx
  on public.refund_followups (event_id)
  where event_id is not null;

create index if not exists refund_followups_enrollment_id_idx
  on public.refund_followups (enrollment_id)
  where enrollment_id is not null;

create index if not exists refund_followups_provider_payment_id_idx
  on public.refund_followups (provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists refund_followups_open_payment_uidx
  on public.refund_followups (provider, provider_payment_id)
  where status = 'open' and provider_payment_id is not null;

drop trigger if exists refund_followups_set_updated_at on public.refund_followups;
create trigger refund_followups_set_updated_at
before update on public.refund_followups
for each row execute function public.set_updated_at();

comment on table public.refund_followups is
  'Open/resolved manual refund queue for paid enrollments cancelled without iyzico refund API.';

alter table public.refund_followups enable row level security;

drop policy if exists refund_followups_admin_all on public.refund_followups;
create policy refund_followups_admin_all
on public.refund_followups for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

grant select, insert, update on public.refund_followups to authenticated;
grant all on public.refund_followups to service_role;

-- Audit action for resolve
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
    'attendance_submitted',
    'refund_followup_resolved'
  ));
