-- D2P Academy | Migration 003
-- Auth bootstrap, certificate code generation, and verification RPC.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(
      case
        when new.raw_user_meta_data ->> 'role' in ('student', 'instructor', 'admin')
          then (new.raw_user_meta_data ->> 'role')::public.user_role
        else 'student'::public.user_role
      end,
      'student'::public.user_role
    )
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table public.certificate_code_sequences (
  issue_year integer primary key,
  last_value bigint not null default 0,
  constraint certificate_code_sequences_year_valid check (issue_year >= 2000)
);

create or replace function public.generate_certificate_code(p_issued_at timestamptz default timezone('utc', now()))
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from p_issued_at)::integer;
  v_sequence bigint;
begin
  insert into public.certificate_code_sequences (issue_year, last_value)
  values (v_year, 1)
  on conflict (issue_year)
  do update
    set last_value = public.certificate_code_sequences.last_value + 1
  returning last_value into v_sequence;

  return format('D2P-%s-%s', v_year, lpad(v_sequence::text, 4, '0'));
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

  v_code := public.generate_certificate_code(timezone('utc', now()));

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

create or replace function public.mask_full_name(p_full_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_parts text[];
  v_first text;
  v_last text;
begin
  v_parts := regexp_split_to_array(trim(p_full_name), '\s+');

  if array_length(v_parts, 1) is null then
    return '***';
  end if;

  v_first := v_parts[1];
  v_last := v_parts[array_length(v_parts, 1)];

  if array_length(v_parts, 1) = 1 then
    return left(v_first, 1) || repeat('*', greatest(char_length(v_first) - 1, 2));
  end if;

  return v_first || ' ' || left(v_last, 1) || repeat('*', greatest(char_length(v_last) - 1, 2));
end;
$$;

create or replace function public.verify_certificate(
  p_certificate_code text,
  p_ip_hash text default null,
  p_user_agent text default null
)
returns table (
  is_valid boolean,
  certificate_code text,
  holder_name text,
  event_title text,
  issued_at timestamptz,
  status public.certificate_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_certificate public.certificates;
  v_is_valid boolean := false;
  v_holder_name text;
  v_event_title text;
  v_normalized_code text := upper(trim(p_certificate_code));
begin
  select *
  into v_certificate
  from public.certificates
  where certificate_code = v_normalized_code;

  if found and v_certificate.status = 'active'::public.certificate_status then
    v_is_valid := true;

    select
      public.mask_full_name(p.full_name),
      e.title
    into v_holder_name, v_event_title
    from public.profiles p
    inner join public.events e on e.id = v_certificate.event_id
    where p.id = v_certificate.user_id;
  end if;

  insert into public.certificate_verification_logs (
    certificate_code,
    certificate_id,
    is_valid,
    ip_hash,
    user_agent
  )
  values (
    v_normalized_code,
    v_certificate.id,
    v_is_valid,
    p_ip_hash,
    p_user_agent
  );

  return query
  select
    v_is_valid,
    coalesce(v_certificate.certificate_code, v_normalized_code),
    v_holder_name,
    v_event_title,
    case when v_is_valid then v_certificate.issued_at else null::timestamptz end,
    case when v_is_valid then v_certificate.status else null::public.certificate_status end;
end;
$$;

grant execute on function public.verify_certificate(text, text, text) to anon, authenticated;
grant execute on function public.issue_certificate(uuid) to authenticated;
