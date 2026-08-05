-- D2P Academy | Migration 058
-- Repair: 056 yarım kaldıysa attendance_status enum + kalan objeleri idempotent tamamlar.

do $$
begin
  create type public.attendance_status as enum ('present', 'absent', 'excused');
exception
  when duplicate_object then null;
end;
$$;

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

create or replace function public.sync_event_sessions(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_day date;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_day_end timestamptz;
  v_index integer := 0;
  v_duration interval;
begin
  select id, start_at, end_at, daily_lesson_start, daily_lesson_end, lesson_duration_minutes
  into v_event
  from public.events
  where id = p_event_id;

  if not found then
    return;
  end if;

  if v_event.daily_lesson_end <= v_event.daily_lesson_start then
    raise exception 'Günlük ders bitiş saati başlangıçtan sonra olmalıdır' using errcode = '22023';
  end if;

  delete from public.event_sessions where event_id = p_event_id;

  v_duration := make_interval(mins => v_event.lesson_duration_minutes);
  v_day := (v_event.start_at at time zone 'Europe/Istanbul')::date;

  while v_day <= (v_event.end_at at time zone 'Europe/Istanbul')::date loop
    v_slot_start := (v_day + v_event.daily_lesson_start) at time zone 'Europe/Istanbul';
    v_day_end := (v_day + v_event.daily_lesson_end) at time zone 'Europe/Istanbul';

    while v_slot_start + v_duration <= v_day_end loop
      v_index := v_index + 1;
      v_slot_end := v_slot_start + v_duration;

      insert into public.event_sessions (event_id, session_index, starts_at, ends_at)
      values (p_event_id, v_index, v_slot_start, v_slot_end);

      v_slot_start := v_slot_end;
    end loop;

    v_day := v_day + 1;
  end loop;
end;
$$;

create or replace function public.maybe_unlock_enrollment_post_test(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_required integer;
  v_total integer;
  v_present integer;
begin
  select e.event_id
  into v_event_id
  from public.enrollments e
  where e.id = p_enrollment_id;

  if not found then
    return;
  end if;

  select count(*)::integer
  into v_total
  from public.event_sessions es
  where es.event_id = v_event_id;

  if v_total = 0 then
    return;
  end if;

  select least(coalesce(ev.required_lesson_count, v_total), v_total)
  into v_required
  from public.events ev
  where ev.id = v_event_id;

  select count(*)::integer
  into v_present
  from public.enrollment_session_attendance esa
  join public.event_sessions es on es.id = esa.session_id
  where esa.enrollment_id = p_enrollment_id
    and esa.status = 'present'::public.attendance_status
    and es.event_id = v_event_id;

  if v_present < v_required then
    return;
  end if;

  update public.enrollments e
  set
    post_test_unlocked_at = coalesce(e.post_test_unlocked_at, timezone('utc', now())),
    post_test_deadline_at = coalesce(
      e.post_test_deadline_at,
      timezone('utc', now()) + interval '14 days'
    ),
    status = case
      when e.status = 'registered'::public.enrollment_status then 'attended'::public.enrollment_status
      else e.status
    end,
    updated_at = timezone('utc', now())
  where e.id = p_enrollment_id;
end;
$$;

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

grant execute on function public.sync_event_sessions(uuid) to authenticated, service_role;
grant execute on function public.maybe_unlock_enrollment_post_test(uuid) to authenticated, service_role;

-- Etkinliklerde ders çizelgesi yoksa oluştur.
do $$
declare
  v_event_id uuid;
begin
  for v_event_id in
    select ev.id
    from public.events ev
    where not exists (
      select 1 from public.event_sessions es where es.event_id = ev.id
    )
  loop
    perform public.sync_event_sessions(v_event_id);
  end loop;
end;
$$;
