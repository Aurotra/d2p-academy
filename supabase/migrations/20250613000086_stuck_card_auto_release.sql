-- D2P Academy | Migration 086
-- Track stuck-card warning mail so the 2h warn / 3h auto-release cron is idempotent.

alter table public.payments
  add column if not exists stuck_warned_at timestamptz,
  add column if not exists stuck_released_at timestamptz;

create index if not exists payments_stuck_warned_at_idx
  on public.payments (stuck_warned_at)
  where stuck_warned_at is not null;

comment on column public.payments.stuck_warned_at is
  'When the parent was emailed that a stuck card checkout still holds a seat (2h).';
comment on column public.payments.stuck_released_at is
  'When the cron auto-released the pending_payment seat (3h).';
