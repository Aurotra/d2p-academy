-- D2P Academy | Migration 023
-- Participant forms (consents, intake, pre/post tests) + student_code = certificate code.
-- Idempotent where practical.

-- ---------------------------------------------------------------------------
-- 1) enrollments: form progress + student_code
-- ---------------------------------------------------------------------------
alter table public.enrollments
  add column if not exists student_code text,
  add column if not exists intake_form_completed_at timestamptz,
  add column if not exists pre_test_completed_at timestamptz,
  add column if not exists post_test_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'enrollments_student_code_unique'
  ) then
    alter table public.enrollments
      add constraint enrollments_student_code_unique unique (student_code);
  end if;
end $$;

create index if not exists enrollments_student_code_idx
  on public.enrollments (student_code)
  where student_code is not null;

-- Cancel clears reserved student_code without reclaiming the sequence (decision A).
create or replace function public.clear_enrollment_student_code_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled'::public.enrollment_status
     and old.status is distinct from 'cancelled'::public.enrollment_status then
    new.student_code := null;
  end if;
  return new;
end;
$$;

drop trigger if exists clear_enrollment_student_code_on_cancel on public.enrollments;
create trigger clear_enrollment_student_code_on_cancel
before update of status on public.enrollments
for each row
execute function public.clear_enrollment_student_code_on_cancel();

-- ---------------------------------------------------------------------------
-- 2) New form tables
-- ---------------------------------------------------------------------------
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  form_type text not null check (form_type in ('scientific', 'media', 'participation')),
  accepted boolean not null default false,
  accepted_at timestamptz not null default timezone('utc', now()),
  ip_address text,
  consent_text_version text,
  media_permissions jsonb,
  parent_signature text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint consent_records_enrollment_form_unique unique (enrollment_id, form_type)
);

create table if not exists public.health_notes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint health_notes_enrollment_unique unique (enrollment_id)
);

create table if not exists public.intake_responses (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  previous_experience jsonb,
  tech_access jsonb,
  interests jsonb,
  motivation jsonb,
  motivation_other text,
  intake_likert jsonb,
  open_ended jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint intake_responses_enrollment_unique unique (enrollment_id)
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  survey_type text not null check (survey_type in ('pre_test', 'post_test')),
  form_version text not null default 'F02-V01',
  dimension_1 jsonb,
  dimension_2 jsonb,
  dimension_3 jsonb,
  dimension_4 jsonb,
  dimension_5 jsonb,
  open_ended text,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint survey_responses_enrollment_type_unique unique (enrollment_id, survey_type)
);

create table if not exists public.post_test_extra (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  training_impact jsonb,
  future_trends jsonb,
  open_ended jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint post_test_extra_enrollment_unique unique (enrollment_id)
);

drop trigger if exists set_consent_records_updated_at on public.consent_records;
create trigger set_consent_records_updated_at
before update on public.consent_records
for each row
execute function public.set_updated_at();

drop trigger if exists set_health_notes_updated_at on public.health_notes;
create trigger set_health_notes_updated_at
before update on public.health_notes
for each row
execute function public.set_updated_at();

drop trigger if exists set_intake_responses_updated_at on public.intake_responses;
create trigger set_intake_responses_updated_at
before update on public.intake_responses
for each row
execute function public.set_updated_at();

drop trigger if exists set_survey_responses_updated_at on public.survey_responses;
create trigger set_survey_responses_updated_at
before update on public.survey_responses
for each row
execute function public.set_updated_at();

drop trigger if exists set_post_test_extra_updated_at on public.post_test_extra;
create trigger set_post_test_extra_updated_at
before update on public.post_test_extra
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
alter table public.consent_records enable row level security;
alter table public.health_notes enable row level security;
alter table public.intake_responses enable row level security;
alter table public.survey_responses enable row level security;
alter table public.post_test_extra enable row level security;

-- health_notes: staff read only; owner insert/update (no owner select)
drop policy if exists health_notes_select_admin on public.health_notes;
create policy health_notes_select_admin
on public.health_notes
for select
to authenticated
using (public.is_admin() or public.is_instructor());

drop policy if exists health_notes_insert_own on public.health_notes;
create policy health_notes_insert_own
on public.health_notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.enrollments e
    where e.id = enrollment_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists health_notes_update_own on public.health_notes;
create policy health_notes_update_own
on public.health_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    where e.id = enrollment_id
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.enrollments e
    where e.id = enrollment_id
      and e.user_id = auth.uid()
  )
);

-- Helper macro-style policies for the other four tables
-- consent_records
drop policy if exists consent_records_select_own on public.consent_records;
create policy consent_records_select_own
on public.consent_records for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists consent_records_select_staff on public.consent_records;
create policy consent_records_select_staff
on public.consent_records for select to authenticated
using (public.is_admin() or public.is_instructor());

drop policy if exists consent_records_insert_own on public.consent_records;
create policy consent_records_insert_own
on public.consent_records for insert to authenticated
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists consent_records_update_own on public.consent_records;
create policy consent_records_update_own
on public.consent_records for update to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

-- intake_responses
drop policy if exists intake_responses_select_own on public.intake_responses;
create policy intake_responses_select_own
on public.intake_responses for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists intake_responses_select_staff on public.intake_responses;
create policy intake_responses_select_staff
on public.intake_responses for select to authenticated
using (public.is_admin() or public.is_instructor());

drop policy if exists intake_responses_insert_own on public.intake_responses;
create policy intake_responses_insert_own
on public.intake_responses for insert to authenticated
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists intake_responses_update_own on public.intake_responses;
create policy intake_responses_update_own
on public.intake_responses for update to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

-- survey_responses
drop policy if exists survey_responses_select_own on public.survey_responses;
create policy survey_responses_select_own
on public.survey_responses for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists survey_responses_select_staff on public.survey_responses;
create policy survey_responses_select_staff
on public.survey_responses for select to authenticated
using (public.is_admin() or public.is_instructor());

drop policy if exists survey_responses_insert_own on public.survey_responses;
create policy survey_responses_insert_own
on public.survey_responses for insert to authenticated
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists survey_responses_update_own on public.survey_responses;
create policy survey_responses_update_own
on public.survey_responses for update to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

-- post_test_extra
drop policy if exists post_test_extra_select_own on public.post_test_extra;
create policy post_test_extra_select_own
on public.post_test_extra for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists post_test_extra_select_staff on public.post_test_extra;
create policy post_test_extra_select_staff
on public.post_test_extra for select to authenticated
using (public.is_admin() or public.is_instructor());

drop policy if exists post_test_extra_insert_own on public.post_test_extra;
create policy post_test_extra_insert_own
on public.post_test_extra for insert to authenticated
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

drop policy if exists post_test_extra_update_own on public.post_test_extra;
create policy post_test_extra_update_own
on public.post_test_extra for update to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 4) SECURITY DEFINER helpers (students cannot UPDATE enrollments via RLS)
-- ---------------------------------------------------------------------------
create or replace function public.assign_enrollment_student_code(p_enrollment_id uuid)
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

  if v_enrollment.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Bu kayıt için işlem yapma yetkiniz yok.';
  end if;

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

create or replace function public.mark_enrollment_form_timestamps(
  p_enrollment_id uuid,
  p_intake boolean default false,
  p_pre_test boolean default false,
  p_post_test boolean default false
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

  if v_enrollment.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Bu kayıt için işlem yapma yetkiniz yok.';
  end if;

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

grant execute on function public.assign_enrollment_student_code(uuid) to authenticated;
grant execute on function public.mark_enrollment_form_timestamps(uuid, boolean, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) issue_certificate — reuse student_code + require post_test
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

  if v_enrollment.post_test_completed_at is null then
    raise exception 'Son test tamamlanmadan sertifika verilemez.';
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
    v_enrollment.id
  )
  returning * into v_certificate;

  return v_certificate;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) revoke_certificate — keep reclaim; also clear student_code (decision A)
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

  perform public.reclaim_certificate_sequence(v_certificate.certificate_code);

  delete from public.certificates
  where id = p_certificate_id;

  update public.enrollments
  set
    status = 'attended'::public.enrollment_status,
    completed_at = null,
    student_code = null,
    updated_at = timezone('utc', now())
  where id = v_certificate.enrollment_id
    and status = 'completed'::public.enrollment_status;

  -- If status was already changed, still clear student_code for this enrollment.
  update public.enrollments
  set
    student_code = null,
    updated_at = timezone('utc', now())
  where id = v_certificate.enrollment_id
    and student_code is not null;

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

grant execute on function public.issue_certificate(uuid) to authenticated;
grant execute on function public.revoke_certificate(uuid, text) to authenticated;
