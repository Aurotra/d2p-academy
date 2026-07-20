-- D2P Academy | Migration 035
-- Enforce profile completeness inside issue_certificate (matches app isProfileComplete).

create or replace function public.is_profile_complete_for_certificate(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_coding text;
  v_hedef text;
  v_beklenti numeric;
  v_interests_ok boolean;
begin
  select *
  into v_profile
  from public.profiles
  where id = p_user_id;

  if not found then
    return false;
  end if;

  v_coding := nullif(trim(coalesce(v_profile.experience_data ->> 'coding_experience', '')), '');
  v_hedef := nullif(trim(coalesce(v_profile.motivation_data ->> 'hedef', '')), '');
  begin
    v_beklenti := nullif(v_profile.motivation_data ->> 'beklenti', '')::numeric;
  exception
    when others then
      v_beklenti := null;
  end;

  v_interests_ok := coalesce(cardinality(v_profile.interests), 0) > 0;

  return
    char_length(trim(coalesce(v_profile.full_name, ''))) > 0
    and char_length(trim(coalesce(v_profile.gender, ''))) > 0
    and char_length(trim(coalesce(v_profile.grade_level, ''))) > 0
    and char_length(trim(coalesce(v_profile.school_name, ''))) > 0
    and char_length(trim(coalesce(v_profile.city_district, ''))) > 0
    and v_coding is not null
    and v_interests_ok
    and v_hedef is not null
    and v_beklenti is not null
    and v_beklenti >= 1
    and v_beklenti <= 5
    and char_length(trim(coalesce(v_profile.profile_avatar_url, ''))) > 0;
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

  if v_enrollment.post_test_completed_at is null then
    raise exception 'Son test tamamlanmadan sertifika verilemez.';
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

grant execute on function public.is_profile_complete_for_certificate(uuid) to authenticated, service_role;
grant execute on function public.issue_certificate(uuid) to authenticated;
