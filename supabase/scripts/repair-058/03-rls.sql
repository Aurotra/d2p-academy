-- ADIM 3/4 — RLS politikaları

alter table public.event_sessions enable row level security;
alter table public.enrollment_session_attendance enable row level security;

drop policy if exists event_sessions_select on public.event_sessions;
create policy event_sessions_select
  on public.event_sessions
  for select
  to authenticated
  using (
    public.is_admin()
    or public.event_has_instructor(event_id)
    or exists (
      select 1
      from public.enrollments e
      where e.event_id = event_sessions.event_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists enrollment_session_attendance_select on public.enrollment_session_attendance;
create policy enrollment_session_attendance_select
  on public.enrollment_session_attendance
  for select
  to authenticated
  using (
    public.is_admin()
    or public.is_instructor_for_enrollment(enrollment_id)
    or exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_session_attendance.enrollment_id
        and e.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_session_attendance.enrollment_id
        and public.is_own_child(e.user_id)
    )
  );

drop policy if exists enrollment_session_attendance_insert on public.enrollment_session_attendance;
create policy enrollment_session_attendance_insert
  on public.enrollment_session_attendance
  for insert
  to authenticated
  with check (
    public.is_admin()
    or public.is_instructor_for_enrollment(enrollment_id)
  );

drop policy if exists enrollment_session_attendance_update on public.enrollment_session_attendance;
create policy enrollment_session_attendance_update
  on public.enrollment_session_attendance
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

drop policy if exists enrollment_session_attendance_delete on public.enrollment_session_attendance;
create policy enrollment_session_attendance_delete
  on public.enrollment_session_attendance
  for delete
  to authenticated
  using (public.is_admin());
