-- D2P Academy | Migration 047
-- Course demand requests: parents express interest before an event/class exists.

create table public.course_demand_requests (
  id uuid primary key default gen_random_uuid(),
  submitted_by_profile_id uuid references public.profiles (id) on delete set null,
  student_profile_id uuid references public.profiles (id) on delete set null,
  student_name text,
  program_code text not null,
  preferred_start_date date not null,
  preferred_end_date date,
  status text not null default 'pending'
    check (status in ('pending', 'grouped', 'converted', 'cancelled')),
  grouped_event_id uuid references public.events (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint course_demand_requests_program_code_format
    check (program_code ~ '^[A-Z]{2,4}$'),
  constraint course_demand_requests_student_identity
    check (student_profile_id is not null or nullif(trim(student_name), '') is not null),
  constraint course_demand_requests_date_range
    check (preferred_end_date is null or preferred_end_date >= preferred_start_date)
);

create unique index course_demand_requests_pending_profile_program
  on public.course_demand_requests (student_profile_id, program_code)
  where status = 'pending' and student_profile_id is not null;

create unique index course_demand_requests_pending_named_student
  on public.course_demand_requests (
    submitted_by_profile_id,
    program_code,
    lower(student_name)
  )
  where status = 'pending'
    and student_profile_id is null
    and student_name is not null;

create index course_demand_requests_program_code_idx
  on public.course_demand_requests (program_code, preferred_start_date);
create index course_demand_requests_status_idx
  on public.course_demand_requests (status);
create index course_demand_requests_submitted_by_idx
  on public.course_demand_requests (submitted_by_profile_id);

alter table public.course_demand_requests enable row level security;

drop policy if exists course_demand_requests_insert_own on public.course_demand_requests;
create policy course_demand_requests_insert_own
  on public.course_demand_requests
  for insert
  to authenticated
  with check (
    submitted_by_profile_id = auth.uid()
    and (
      student_profile_id is null
      or public.is_own_child(student_profile_id)
    )
  );

drop policy if exists course_demand_requests_select_own on public.course_demand_requests;
create policy course_demand_requests_select_own
  on public.course_demand_requests
  for select
  to authenticated
  using (
    submitted_by_profile_id = auth.uid()
    or (student_profile_id is not null and public.is_own_child(student_profile_id))
  );

drop policy if exists course_demand_requests_select_admin on public.course_demand_requests;
create policy course_demand_requests_select_admin
  on public.course_demand_requests
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists course_demand_requests_update_admin on public.course_demand_requests;
create policy course_demand_requests_update_admin
  on public.course_demand_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists course_demand_requests_delete_admin on public.course_demand_requests;
create policy course_demand_requests_delete_admin
  on public.course_demand_requests
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin: convert demand requests into event + enrollments (no strict capacity)
-- ---------------------------------------------------------------------------
create or replace function public.convert_course_demand_requests(
  p_demand_request_ids uuid[],
  p_event_id uuid default null,
  p_program_code text default null,
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_title text default null,
  p_capacity integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_demand_id uuid;
  v_row public.course_demand_requests%rowtype;
  v_event_id uuid;
  v_event_title text;
  v_program_code text;
  v_converted integer := 0;
  v_grouped integer := 0;
  v_skipped integer := 0;
  v_existing public.enrollments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gereklidir.';
  end if;

  if p_demand_request_ids is null or array_length(p_demand_request_ids, 1) is null then
    return jsonb_build_object('eventId', null, 'converted', 0, 'grouped', 0, 'skipped', 0);
  end if;

  v_event_id := p_event_id;

  if v_event_id is null then
    if p_program_code is null or p_start_at is null or p_end_at is null then
      raise exception 'Yeni etkinlik için program_code, start_at ve end_at gerekli.';
    end if;

    v_program_code := upper(trim(p_program_code));
    v_event_title := coalesce(
      nullif(trim(p_title), ''),
      v_program_code || ' Sınıfı'
    );

    insert into public.events (
      title,
      slug,
      description,
      event_type,
      start_at,
      end_at,
      max_capacity,
      status,
      program_code
    )
    values (
      v_event_title,
      lower(v_program_code) || '-' || extract(epoch from timezone('utc', now()))::bigint::text,
      'Kurs taleplerinden oluşturulan sınıf.',
      'training',
      p_start_at,
      p_end_at,
      p_capacity,
      'draft',
      v_program_code
    )
    returning id into v_event_id;
  else
    select id into v_event_id from public.events where id = v_event_id;
    if not found then
      raise exception 'Etkinlik bulunamadı.';
    end if;
  end if;

  foreach v_demand_id in array p_demand_request_ids loop
    select *
    into v_row
    from public.course_demand_requests
    where id = v_demand_id
      and status in ('pending', 'grouped')
    for update;

    if not found then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_row.student_profile_id is null then
      update public.course_demand_requests
      set status = 'grouped',
          grouped_event_id = v_event_id
      where id = v_row.id;
      v_grouped := v_grouped + 1;
      continue;
    end if;

    select *
    into v_existing
    from public.enrollments
    where user_id = v_row.student_profile_id
      and event_id = v_event_id;

    if found then
      if v_existing.status = 'cancelled' then
        update public.enrollments
        set status = 'registered',
            completed_at = null
        where id = v_existing.id;
      end if;
    else
      insert into public.enrollments (user_id, event_id, status)
      values (v_row.student_profile_id, v_event_id, 'registered');
    end if;

    update public.course_demand_requests
    set status = 'converted',
        grouped_event_id = v_event_id
    where id = v_row.id;

    v_converted := v_converted + 1;
  end loop;

  return jsonb_build_object(
    'eventId', v_event_id,
    'converted', v_converted,
    'grouped', v_grouped,
    'skipped', v_skipped
  );
end;
$$;
