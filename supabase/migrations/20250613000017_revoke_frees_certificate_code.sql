-- D2P Academy | Migration 017
-- Revoke frees enrollment + reclaims certificate code when it was the latest sequence.
-- Idempotent.

-- ---------------------------------------------------------------------------
-- Helper: try to roll back sequence if revoked/deleted code was the last issued
-- ---------------------------------------------------------------------------
create or replace function public.reclaim_certificate_sequence(p_certificate_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_certificate_code));
  v_program text;
  v_year integer;
  v_seq bigint;
  v_yy integer;
begin
  -- New format: D2P-{CODE}-{YY}-{#####}
  if v_code ~ '^D2P-[A-Z]{2,4}-[0-9]{2}-[0-9]{5}$' then
    v_program := (regexp_match(v_code, '^D2P-([A-Z]{2,4})-'))[1];
    v_yy := ((regexp_match(v_code, '-([0-9]{2})-[0-9]{5}$'))[1])::integer;
    v_seq := ((regexp_match(v_code, '-([0-9]{5})$'))[1])::bigint;
    v_year := 2000 + v_yy;

    update public.certificate_code_sequences s
    set last_value = greatest(v_seq - 1, 99)
    where s.program_code = v_program
      and s.issue_year = v_year
      and s.last_value = v_seq;
    return;
  end if;

  -- Legacy format: D2P-{YYYY}-{####+}
  if v_code ~ '^D2P-[0-9]{4}-[0-9]{4,}$' then
    v_year := ((regexp_match(v_code, '^D2P-([0-9]{4})-'))[1])::integer;
    v_seq := ((regexp_match(v_code, '-([0-9]{4,})$'))[1])::bigint;

    update public.certificate_code_sequences s
    set last_value = greatest(v_seq - 1, 0)
    where s.program_code = 'LEGACY'
      and s.issue_year = v_year
      and s.last_value = v_seq;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- revoke_certificate: delete row (frees code) + reclaim sequence when possible
-- ---------------------------------------------------------------------------
create or replace function public.revoke_certificate(
  p_certificate_id uuid,
  p_revoke_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_certificate public.certificates;
begin
  if not public.is_admin() then
    raise exception 'Sertifika iptal etmek için admin yetkisi gerekli.';
  end if;

  select *
  into v_certificate
  from public.certificates
  where id = p_certificate_id
  for update;

  if not found then
    raise exception 'Sertifika bulunamadı.';
  end if;

  if v_certificate.status = 'revoked'::public.certificate_status then
    -- Already soft-revoked earlier: still free the row/code.
    null;
  end if;

  -- Preserve reason on verification history via log table if needed later.
  perform public.reclaim_certificate_sequence(v_certificate.certificate_code);

  delete from public.certificates
  where id = p_certificate_id;

  -- Optional breadcrumb (no certificate_id after delete — store code only).
  insert into public.certificate_verification_logs (
    certificate_code,
    certificate_id,
    is_valid,
    ip_hash,
    user_agent
  )
  values (
    v_certificate.certificate_code,
    null,
    false,
    null,
    left(concat('revoke:', coalesce(nullif(trim(p_revoke_reason), ''), 'admin')), 500)
  );
end;
$$;

grant execute on function public.reclaim_certificate_sequence(text) to authenticated;
grant execute on function public.revoke_certificate(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- issue_certificate: only block ACTIVE certificates; remove revoked leftovers
-- ---------------------------------------------------------------------------
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
  where id = p_enrollment_id;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  if v_enrollment.status <> 'completed'::public.enrollment_status then
    raise exception 'Sertifika vermeden önce kayıt Tamamlandı olmalıdır.';
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

    -- Soft-revoked leftover: free code then re-issue.
    perform public.reclaim_certificate_sequence(v_existing.certificate_code);
    delete from public.certificates where id = v_existing.id;
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

-- ---------------------------------------------------------------------------
-- One-time cleanup: soft-revoked rows still holding codes (e.g. D2P-YK-26-00100)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select id, certificate_code
    from public.certificates
    where status = 'revoked'::public.certificate_status
  loop
    perform public.reclaim_certificate_sequence(r.certificate_code);
    delete from public.certificates where id = r.id;
  end loop;
end $$;
