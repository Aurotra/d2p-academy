-- D2P Academy | Migration 049
-- When a parent creates a child profile, link matching course demand requests
-- (by submitted parent + normalized student name) and complete grouped enrollments.

create or replace function public.normalize_person_name(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

create or replace function public.link_course_demands_to_student_profile(
  p_student_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid;
  v_student_name text;
  v_row public.course_demand_requests%rowtype;
  v_linked integer := 0;
  v_enrolled integer := 0;
  v_existing public.enrollments%rowtype;
begin
  select parent_id, public.normalize_person_name(full_name)
  into v_parent_id, v_student_name
  from public.profiles
  where id = p_student_profile_id
    and role = 'student';

  if not found or v_parent_id is null or v_student_name = '' then
    raise exception 'Geçersiz öğrenci profili.';
  end if;

  if not public.is_own_child(p_student_profile_id) and not public.is_admin() then
    raise exception 'Bu işlem için yetkiniz yok.';
  end if;

  for v_row in
    select *
    from public.course_demand_requests
    where submitted_by_profile_id = v_parent_id
      and student_profile_id is null
      and student_name is not null
      and public.normalize_person_name(student_name) = v_student_name
      and status in ('pending', 'grouped')
    for update
  loop
    if v_row.status = 'grouped' and v_row.grouped_event_id is not null then
      select *
      into v_existing
      from public.enrollments
      where user_id = p_student_profile_id
        and event_id = v_row.grouped_event_id;

      if found then
        if v_existing.status = 'cancelled' then
          update public.enrollments
          set status = 'registered',
              completed_at = null
          where id = v_existing.id;
        end if;
      else
        insert into public.enrollments (user_id, event_id, status)
        values (p_student_profile_id, v_row.grouped_event_id, 'registered');
      end if;

      update public.course_demand_requests
      set student_profile_id = p_student_profile_id,
          status = 'converted'
      where id = v_row.id;

      v_enrolled := v_enrolled + 1;
    else
      update public.course_demand_requests
      set student_profile_id = p_student_profile_id
      where id = v_row.id;
    end if;

    v_linked := v_linked + 1;
  end loop;

  return jsonb_build_object(
    'linked', v_linked,
    'enrolled', v_enrolled
  );
end;
$$;
