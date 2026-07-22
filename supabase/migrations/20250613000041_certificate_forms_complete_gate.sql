-- D2P Academy | Migration 041
-- Certificate queue/issue must require full participant forms (including consents).

create or replace function public.is_enrollment_consents_complete(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where cr.form_type = 'scientific' and cr.accepted) = 1
    and count(*) filter (where cr.form_type = 'participation' and cr.accepted) = 1
    and count(*) filter (
      where cr.form_type = 'media'
        and cr.accepted
        and coalesce((cr.media_permissions->>'photo_capture')::boolean, false)
        and coalesce((cr.media_permissions->>'video_capture')::boolean, false)
        and coalesce((cr.media_permissions->>'website_publish')::boolean, false)
        and coalesce((cr.media_permissions->>'social_media_publish')::boolean, false)
        and coalesce((cr.media_permissions->>'print_materials')::boolean, false)
        and coalesce((cr.media_permissions->>'academic_anonymous_use')::boolean, false)
        and coalesce((cr.media_permissions->>'municipal_reports')::boolean, false)
    ) = 1
  from public.consent_records cr
  where cr.enrollment_id = p_enrollment_id;
$$;

create or replace function public.is_enrollment_forms_complete(p_enrollment_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments%rowtype;
  v_grade text;
  v_requires_surveys boolean;
begin
  select e.*, p.grade_level
  into v_enrollment, v_grade
  from public.enrollments e
  join public.profiles p on p.id = e.user_id
  where e.id = p_enrollment_id;

  if not found then
    return false;
  end if;

  if v_enrollment.intake_form_completed_at is null then
    return false;
  end if;

  if not public.is_enrollment_consents_complete(p_enrollment_id) then
    return false;
  end if;

  v_requires_surveys := coalesce(v_grade, '') in ('5', '6', '7', '8');

  if v_requires_surveys then
    return v_enrollment.pre_test_completed_at is not null
      and v_enrollment.post_test_completed_at is not null;
  end if;

  return v_enrollment.pre_test_completed_at is not null;
end;
$$;

create or replace function public.issue_certificate(p_enrollment_id uuid)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments;
  v_certificate public.certificates;
  v_program_code text;
  v_code text;
  v_existing public.certificates;
begin
  if not public.is_admin() then
    raise exception 'Sertifika vermek için admin yetkisi gerekli.';
  end if;

  select *
  into v_enrollment
  from public.enrollments
  where id = p_enrollment_id
  for update;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  if v_enrollment.status in (
    'cancelled'::public.enrollment_status,
    'no_show'::public.enrollment_status
  ) then
    raise exception 'İptal veya gelmedi durumundaki kayda sertifika verilemez.';
  end if;

  if not public.is_enrollment_forms_complete(p_enrollment_id) then
    raise exception 'Katılımcı formları tamamlanmadan sertifika verilemez.';
  end if;

  if not public.is_profile_complete_for_certificate(v_enrollment.user_id) then
    raise exception
      'Öncelikle öğrencinin profilini %%100 tamamlayın (kendini tanıtma). Tamamlanan proje sayısı isteğe bağlıdır.';
  end if;

  if v_enrollment.status <> 'completed'::public.enrollment_status then
    update public.enrollments
    set
      status = 'completed'::public.enrollment_status,
      completed_at = coalesce(completed_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
    where id = p_enrollment_id
    returning * into v_enrollment;
  end if;

  select *
  into v_existing
  from public.certificates
  where enrollment_id = p_enrollment_id
  for update;

  if found then
    if v_existing.status = 'active'::public.certificate_status then
      raise exception
        'Bu kayıt için sertifika zaten oluşturulmuş. Listeden PDF Oluştur’a tıklayın.';
    end if;

    perform public.reclaim_certificate_sequence(v_existing.certificate_code);
    delete from public.certificates where id = v_existing.id;
  end if;

  if nullif(trim(v_enrollment.student_code), '') is not null then
    v_code := upper(trim(v_enrollment.student_code));
  else
    select nullif(trim(e.program_code), '')
    into v_program_code
    from public.events e
    where e.id = v_enrollment.event_id;

    if v_program_code is null then
      raise exception
        'Etkinlikte program kodu eksik. Sertifika vermeden önce program_code atayın (ör. DC).';
    end if;

    v_code := public.generate_certificate_code(v_program_code, timezone('utc', now()));

    update public.enrollments
    set
      student_code = v_code,
      updated_at = timezone('utc', now())
    where id = p_enrollment_id;
  end if;

  insert into public.certificates (
    certificate_code,
    user_id,
    event_id,
    enrollment_id
  )
  values (
    v_code,
    v_enrollment.user_id,
    v_enrollment.event_id,
    p_enrollment_id
  )
  returning * into v_certificate;

  return v_certificate;
end;
$$;

-- Repair: remove premature post_test stamps (e.g. before consents on non 5–8).
update public.enrollments e
set
  post_test_completed_at = null,
  updated_at = timezone('utc', now())
where e.post_test_completed_at is not null
  and not public.is_enrollment_forms_complete(e.id);

grant execute on function public.is_enrollment_consents_complete(uuid) to authenticated, service_role;
grant execute on function public.is_enrollment_forms_complete(uuid) to authenticated, service_role;
