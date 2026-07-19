-- D2P Academy | Migration 033
-- Durable rate limit store for username student login (survives serverless instances).

create table if not exists public.auth_rate_limits (
  rate_key text primary key,
  attempt_count integer not null default 0,
  window_started_at timestamptz not null default timezone('utc', now()),
  constraint auth_rate_limits_attempt_count_nonneg check (attempt_count >= 0)
);

alter table public.auth_rate_limits enable row level security;

-- No client policies: service_role only.
revoke all on table public.auth_rate_limits from anon, authenticated;

comment on table public.auth_rate_limits is
  'IP+username login attempt windows for /api/v1/auth/student-login';
