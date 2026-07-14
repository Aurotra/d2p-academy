-- D2P Academy | Migration 015
-- Translate certificate RPC exception messages to Turkish (idempotent).

create or replace function public.generate_certificate_code(
  p_program_code text,
  p_issued_at timestamptz default timezone('utc', now())
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_code text := upper(trim(p_program_code));
  v_year integer := extract(year from p_issued_at)::integer;
  v_yy text := lpad((v_year % 100)::text, 2, '0');
  v_sequence bigint;
  c_start_value constant bigint := 100;
begin
  if v_program_code is null or char_length(v_program_code) < 2 or char_length(v_program_code) > 4 then
    raise exception 'Geçersiz program kodu. 2–4 harf kullanın (ör. DC).';
  end if;

  if v_program_code !~ '^[A-Z]{2,4}$' then
    raise exception 'Geçersiz program kodu. Yalnızca A–Z harflerine izin verilir (ör. DC).';
  end if;

  insert into public.certificate_code_sequences (program_code, issue_year, last_value)
  values (v_program_code, v_year, c_start_value)
  on conflict (program_code, issue_year)
  do update
    set last_value = public.certificate_code_sequences.last_value + 1
  returning last_value into v_sequence;

  return format(
    'D2P-%s-%s-%s',
    v_program_code,
    v_yy,
    lpad(v_sequence::text, 5, '0')
  );
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
begin
  if not public.is_admin() then
    raise exception 'Sertifika vermek için admin yetkisi gerekli.';
  end if;

  select *
  into v_enrollment
  from public.enrollments
  where id = p_enrollment_id;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  if v_enrollment.status <> 'completed'::public.enrollment_status then
    raise exception 'Sertifika vermeden önce kayıt Tamamlandı olmalıdır.';
  end if;

  if exists (
    select 1
    from public.certificates
    where enrollment_id = p_enrollment_id
  ) then
    raise exception
      'Bu kayıt için sertifika zaten oluşturulmuş. Listeden PDF Oluştur’a tıklayın.';
  end if;

  select nullif(trim(e.program_code), '')
  into v_program_code
  from public.events e
  where e.id = v_enrollment.event_id;

  if v_program_code is null then
    raise exception
      'Etkinlikte program kodu eksik. Sertifika vermeden önce program_code atayın (ör. DC).';
  end if;

  v_code := public.generate_certificate_code(v_program_code, timezone('utc', now()));

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
    v_enrollment.id
  )
  returning * into v_certificate;

  return v_certificate;
end;
$$;
