-- D2P Academy | Migration 034
-- Form helper RPCs: allow service_role callers with explicit p_actor_id
-- (username-student JWT path uses service_role; auth.uid() is null).

create or replace function public.assert_enrollment_actor(
  p_enrollment_user_id uuid,
  p_actor_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(auth.uid(), p_actor_id);
begin
  if public.is_admin() then
    return;
  end if;

  if v_actor is null then
    raise exception 'Bu kayıt için işlem yapma yetkiniz yok.' using errcode = '42501';
  end if;

  if p_enrollment_user_id <> v_actor then
    raise exception 'Bu kayıt için işlem yapma yetkiniz yok.' using errcode = '42501';
  end if;
end;
$$;

drop function if exists public.assign_enrollment_student_code(uuid);

create or replace function public.assign_enrollment_student_code(
  p_enrollment_id uuid,
  p_actor_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments;
  v_program_code text;
  v_code text;
begin
  select *
  into v_enrollment
  from public.enrollments
  where id = p_enrollment_id
  for update;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  perform public.assert_enrollment_actor(v_enrollment.user_id, p_actor_id);

  if nullif(trim(v_enrollment.student_code), '') is not null then
    return v_enrollment.student_code;
  end if;

  select nullif(trim(e.program_code), '')
  into v_program_code
  from public.events e
  where e.id = v_enrollment.event_id;

  if v_program_code is null then
    raise exception
      'Etkinlikte program kodu eksik. Önce etkinliğe program_code atayın (ör. DC).';
  end if;

  v_code := public.generate_certificate_code(v_program_code, timezone('utc', now()));

  update public.enrollments
  set
    student_code = v_code,
    updated_at = timezone('utc', now())
  where id = p_enrollment_id;

  return v_code;
end;
$$;

drop function if exists public.mark_enrollment_form_timestamps(uuid, boolean, boolean, boolean);

create or replace function public.mark_enrollment_form_timestamps(
  p_enrollment_id uuid,
  p_intake boolean default false,
  p_pre_test boolean default false,
  p_post_test boolean default false,
  p_actor_id uuid default null
)
returns public.enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments;
begin
  select *
  into v_enrollment
  from public.enrollments
  where id = p_enrollment_id
  for update;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  perform public.assert_enrollment_actor(v_enrollment.user_id, p_actor_id);

  update public.enrollments
  set
    intake_form_completed_at = case
      when p_intake then coalesce(intake_form_completed_at, timezone('utc', now()))
      else intake_form_completed_at
    end,
    pre_test_completed_at = case
      when p_pre_test then coalesce(pre_test_completed_at, timezone('utc', now()))
      else pre_test_completed_at
    end,
    post_test_completed_at = case
      when p_post_test then coalesce(post_test_completed_at, timezone('utc', now()))
      else post_test_completed_at
    end,
    updated_at = timezone('utc', now())
  where id = p_enrollment_id
  returning * into v_enrollment;

  return v_enrollment;
end;
$$;

drop function if exists public.upsert_own_health_note(uuid, text);

create or replace function public.upsert_own_health_note(
  p_enrollment_id uuid,
  p_note text,
  p_actor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select e.user_id
  into v_owner
  from public.enrollments e
  where e.id = p_enrollment_id;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  perform public.assert_enrollment_actor(v_owner, p_actor_id);

  if nullif(trim(p_note), '') is null then
    delete from public.health_notes
    where enrollment_id = p_enrollment_id;
    return;
  end if;

  insert into public.health_notes (enrollment_id, note)
  values (p_enrollment_id, trim(p_note))
  on conflict (enrollment_id)
  do update
    set note = excluded.note,
        updated_at = timezone('utc', now());
end;
$$;

grant execute on function public.assert_enrollment_actor(uuid, uuid) to authenticated, service_role;
grant execute on function public.assign_enrollment_student_code(uuid, uuid) to authenticated, service_role;
grant execute on function public.mark_enrollment_form_timestamps(uuid, boolean, boolean, boolean, uuid)
  to authenticated, service_role;
grant execute on function public.upsert_own_health_note(uuid, text, uuid) to authenticated, service_role;
