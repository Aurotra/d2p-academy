-- D2P Academy | Migration 042
-- Daily attendance per enrollment, scoped to event instructor/admin.

create type public.attendance_status as enum ('present', 'absent', 'excused');

create table if not exists public.enrollment_attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  attendance_date date not null,
  status public.attendance_status not null,
  notes text,
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint enrollment_attendance_unique_day unique (enrollment_id, attendance_date)
);

create index if not exists enrollment_attendance_enrollment_id_idx
  on public.enrollment_attendance (enrollment_id);

create index if not exists enrollment_attendance_date_idx
  on public.enrollment_attendance (attendance_date);

create or replace function public.is_instructor_for_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.events ev on ev.id = e.event_id
    where e.id = p_enrollment_id
      and ev.instructor_id = auth.uid()
      and public.is_instructor()
  );
$$;

create or replace function public.is_instructor_for_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events ev
    where ev.id = p_event_id
      and ev.instructor_id = auth.uid()
      and public.is_instructor()
  );
$$;

alter table public.enrollment_attendance enable row level security;

drop policy if exists enrollment_attendance_select on public.enrollment_attendance;
create policy enrollment_attendance_select
  on public.enrollment_attendance
  for select
  to authenticated
  using (
    public.is_admin()
    or public.is_instructor_for_enrollment(enrollment_id)
    or exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_attendance.enrollment_id
        and e.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_attendance.enrollment_id
        and public.is_own_child(e.user_id)
    )
  );

drop policy if exists enrollment_attendance_insert on public.enrollment_attendance;
create policy enrollment_attendance_insert
  on public.enrollment_attendance
  for insert
  to authenticated
  with check (
    public.is_admin()
    or public.is_instructor_for_enrollment(enrollment_id)
  );

drop policy if exists enrollment_attendance_update on public.enrollment_attendance;
create policy enrollment_attendance_update
  on public.enrollment_attendance
  for update
  to authenticated
  using (
    public.is_admin()
    or public.is_instructor_for_enrollment(enrollment_id)
  )
  with check (
    public.is_admin()
    or public.is_instructor_for_enrollment(enrollment_id)
  );

drop policy if exists enrollment_attendance_delete on public.enrollment_attendance;
create policy enrollment_attendance_delete
  on public.enrollment_attendance
  for delete
  to authenticated
  using (public.is_admin());

-- Instructors can read student profiles for their event enrollments.
drop policy if exists profiles_select_instructor_students on public.profiles;
create policy profiles_select_instructor_students
  on public.profiles
  for select
  to authenticated
  using (
    public.is_admin()
    or id = auth.uid()
    or exists (
      select 1
      from public.enrollments e
      join public.events ev on ev.id = e.event_id
      where e.user_id = profiles.id
        and ev.instructor_id = auth.uid()
        and public.is_instructor()
    )
  );

grant execute on function public.is_instructor_for_enrollment(uuid) to authenticated, service_role;
grant execute on function public.is_instructor_for_event(uuid) to authenticated, service_role;
