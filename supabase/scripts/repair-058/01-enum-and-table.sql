-- ADIM 1/4 — Kolonlar + event_sessions + yoklama tablosu
-- Supabase SQL Editor: dosyanın TAMAMINI kopyala, Run. Sonra 02'ye geç.

-- 1) Enum (042 atlanmışsa)
do $$
begin
  create type public.attendance_status as enum ('present', 'absent', 'excused');
exception
  when duplicate_object then null;
end;
$$;

-- 2) events / enrollments kolonları (056 yarım kaldıysa)
alter table public.events
  add column if not exists daily_lesson_start time not null default '09:00',
  add column if not exists daily_lesson_end time not null default '17:00',
  add column if not exists lesson_duration_minutes integer not null default 60,
  add column if not exists required_lesson_count integer;

alter table public.enrollments
  add column if not exists post_test_unlocked_at timestamptz,
  add column if not exists post_test_deadline_at timestamptz;

-- 3) Ders çizelgesi tablosu (ÖNCE bu oluşmalı)
create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  session_index integer not null check (session_index > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint event_sessions_unique_index unique (event_id, session_index),
  constraint event_sessions_time_order check (ends_at > starts_at)
);

create index if not exists event_sessions_event_id_idx on public.event_sessions (event_id);
create index if not exists event_sessions_starts_at_idx on public.event_sessions (starts_at);

-- 4) Saat bazlı yoklama tablosu
create table if not exists public.enrollment_session_attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  session_id uuid not null references public.event_sessions (id) on delete cascade,
  status public.attendance_status not null,
  notes text,
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint enrollment_session_attendance_unique unique (enrollment_id, session_id)
);

create index if not exists enrollment_session_attendance_enrollment_id_idx
  on public.enrollment_session_attendance (enrollment_id);

create index if not exists enrollment_session_attendance_session_id_idx
  on public.enrollment_session_attendance (session_id);
