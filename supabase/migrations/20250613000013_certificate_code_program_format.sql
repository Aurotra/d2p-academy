-- D2P Academy | Migration 013
-- Certificate codes: program-based sequences + dual-format validation.
-- Idempotent. Does NOT rewrite existing certificate_code values (legacy rows stay as-is).
--
-- Sequence migration strategy:
--   Old PK was issue_year only. New PK is (program_code, issue_year).
--   Existing sequence rows get program_code = 'LEGACY' so historical counters are preserved
--   without colliding with real programs (e.g. DC). New issuances never use LEGACY —
--   they require events.program_code (e.g. DC).

-- ---------------------------------------------------------------------------
-- 1) events.program_code (required by updated generate/issue functions)
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists program_code text;

comment on column public.events.program_code is
  'Manual admin-entered program code for certificates (e.g. DC). Free text, typically 2-4 uppercase letters.';

-- Seed known programs (idempotent: only fills nulls).
-- Current production events (2026-07) + Discovery pattern for future/existing titles.
update public.events
set program_code = 'DC'
where program_code is null
  and title ilike '%discovery%';

update public.events
set program_code = 'TT'
where program_code is null
  and id = 'd6690505-dfbf-4767-9128-9363912134a6'; -- 3D Tasarım Temelleri (Modelleme)

update public.events
set program_code = 'YK'
where program_code is null
  and id = '70afc572-ebe5-48e5-b561-44c0943cd5d5'; -- 3D Yaz Kursu - 3D Yazıcı Teknolojileri Eğitimi

update public.events
set program_code = 'YT'
where program_code is null
  and id = '55a54a4b-79af-47ac-8f18-e95108c53208'; -- 3D Yazıcı Teknolojileri ve Üretim Atölyesi

update public.events
set program_code = 'IM'
where program_code is null
  and id = '44e39dbe-e60f-4407-86e2-69e447ed1370'; -- İleri Seviye 3D Modelleme ve Prototipleme

-- ---------------------------------------------------------------------------
-- 2) certificate_code_sequences → composite key (program_code, issue_year)
-- ---------------------------------------------------------------------------
alter table public.certificate_code_sequences
  add column if not exists program_code text;

update public.certificate_code_sequences
set program_code = 'LEGACY'
where program_code is null;

alter table public.certificate_code_sequences
  alter column program_code set not null;

-- Drop year-only primary key if still present.
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'certificate_code_sequences'
      and constraint_type = 'PRIMARY KEY'
      and constraint_name = 'certificate_code_sequences_pkey'
  ) then
    -- Only drop if PK is still single-column (issue_year).
    if (
      select count(*)
      from information_schema.key_column_usage
      where table_schema = 'public'
        and table_name = 'certificate_code_sequences'
        and constraint_name = 'certificate_code_sequences_pkey'
    ) = 1 then
      alter table public.certificate_code_sequences
        drop constraint certificate_code_sequences_pkey;
    end if;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'certificate_code_sequences'
      and constraint_type = 'PRIMARY KEY'
  ) then
    alter table public.certificate_code_sequences
      add constraint certificate_code_sequences_pkey
      primary key (program_code, issue_year);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3) generate_certificate_code — program + YY + 5-digit seq starting at 100
-- ---------------------------------------------------------------------------
drop function if exists public.generate_certificate_code(timestamptz);

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
  -- Explicit start for every new (program_code, year) pair — not Postgres default 1.
  c_start_value constant bigint := 100;
begin
  if v_program_code is null or char_length(v_program_code) < 2 or char_length(v_program_code) > 4 then
    raise exception 'Invalid program_code. Use 2–4 letters (e.g. DC).';
  end if;

  if v_program_code !~ '^[A-Z]{2,4}$' then
    raise exception 'Invalid program_code. Only A–Z letters are allowed (e.g. DC).';
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

-- ---------------------------------------------------------------------------
-- 4) issue_certificate — use event.program_code when generating codes
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
begin
  if not public.is_admin() then
    raise exception 'Only admins can issue certificates.';
  end if;

  select *
  into v_enrollment
  from public.enrollments
  where id = p_enrollment_id;

  if not found then
    raise exception 'Enrollment not found.';
  end if;

  if v_enrollment.status <> 'completed'::public.enrollment_status then
    raise exception 'Enrollment must be completed before issuing a certificate.';
  end if;

  if exists (
    select 1
    from public.certificates
    where enrollment_id = p_enrollment_id
  ) then
    raise exception 'Certificate already exists for this enrollment.';
  end if;

  select nullif(trim(e.program_code), '')
  into v_program_code
  from public.events e
  where e.id = v_enrollment.event_id;

  if v_program_code is null then
    raise exception
      'Event program_code is missing. Set program_code on the event (e.g. DC) before issuing a certificate.';
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

grant execute on function public.generate_certificate_code(text, timestamptz) to authenticated;
grant execute on function public.issue_certificate(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) certificates.code format: OLD OR NEW (do not invalidate legacy rows)
-- ---------------------------------------------------------------------------
alter table public.certificates
  drop constraint if exists certificates_code_format;

alter table public.certificates
  add constraint certificates_code_format check (
    certificate_code ~* '^D2P-[0-9]{4}-[0-9]{4,}$'
    or certificate_code ~* '^D2P-[A-Z]{2,4}-[0-9]{2}-[0-9]{5}$'
  );
