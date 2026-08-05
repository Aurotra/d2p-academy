-- D2P Academy | Migration 062
-- total_lesson_count: yoklama oturum sayısı (ör. 12)
-- required_lesson_count: sertifika / F03 için minimum «geldi» (ör. 8)

alter table public.events
  add column if not exists total_lesson_count integer
    check (total_lesson_count is null or total_lesson_count > 0);

-- Eski tek alan oturum sayısı olarak kullanılıyordu (061).
update public.events
set total_lesson_count = coalesce(total_lesson_count, required_lesson_count, 12)
where total_lesson_count is null;

-- Zorunlu katılım eşiği: varsayılan 8; eskiden toplam ile aynıysa 8'e çek.
update public.events
set required_lesson_count = 8
where required_lesson_count is null
   or required_lesson_count = total_lesson_count;

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
  v_target_count integer;
begin
  select
    id,
    start_at,
    end_at,
    daily_lesson_start,
    daily_lesson_end,
    lesson_duration_minutes,
    total_lesson_count
  into v_event
  from public.events
  where id = p_event_id;

  if not found then
    return;
  end if;

  if v_event.daily_lesson_end <= v_event.daily_lesson_start then
    raise exception 'Günlük ders bitiş saati başlangıçtan sonra olmalıdır' using errcode = '22023';
  end if;

  v_target_count := v_event.total_lesson_count;
  v_duration := make_interval(mins => v_event.lesson_duration_minutes);

  delete from public.event_sessions where event_id = p_event_id;

  v_day := (v_event.start_at at time zone 'Europe/Istanbul')::date;

  while v_day <= (v_event.end_at at time zone 'Europe/Istanbul')::date loop
    exit when v_target_count is not null and v_index >= v_target_count;

    v_slot_start := (v_day + v_event.daily_lesson_start) at time zone 'Europe/Istanbul';
    v_day_end := (v_day + v_event.daily_lesson_end) at time zone 'Europe/Istanbul';

    while v_slot_start + v_duration <= v_day_end loop
      exit when v_target_count is not null and v_index >= v_target_count;

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

create or replace function public.count_enrollment_present_sessions(p_enrollment_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.enrollment_session_attendance esa
  join public.event_sessions es on es.id = esa.session_id
  join public.enrollments e on e.id = esa.enrollment_id
  where esa.enrollment_id = p_enrollment_id
    and esa.status = 'present'::public.attendance_status
    and es.event_id = e.event_id;
$$;

create or replace function public.enrollment_attendance_complete(p_enrollment_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_required integer;
  v_present integer;
begin
  select coalesce(ev.required_lesson_count, 8)
  into v_required
  from public.enrollments e
  join public.events ev on ev.id = e.event_id
  where e.id = p_enrollment_id;

  if not found then
    return false;
  end if;

  v_present := public.count_enrollment_present_sessions(p_enrollment_id);
  return v_present >= v_required;
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
  v_present integer;
begin
  select e.event_id
  into v_event_id
  from public.enrollments e
  where e.id = p_enrollment_id;

  if not found then
    return;
  end if;

  select coalesce(ev.required_lesson_count, 8)
  into v_required
  from public.events ev
  where ev.id = v_event_id;

  v_present := public.count_enrollment_present_sessions(p_enrollment_id);

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

grant execute on function public.count_enrollment_present_sessions(uuid) to authenticated, service_role;
grant execute on function public.enrollment_attendance_complete(uuid) to authenticated, service_role;
