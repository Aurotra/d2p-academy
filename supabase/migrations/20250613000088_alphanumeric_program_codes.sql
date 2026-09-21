-- D2P Academy | Migration 088
-- Allow alphanumeric program codes (e.g. 3DTY) in programs, course demand, certificates.

-- 1) programs.check
alter table public.programs
  drop constraint if exists programs_program_code_format;

alter table public.programs
  add constraint programs_program_code_format
  check (program_code ~ '^[A-Z0-9]{2,4}$');

-- 2) course_demand_requests.check
alter table public.course_demand_requests
  drop constraint if exists course_demand_requests_program_code_format;

alter table public.course_demand_requests
  add constraint course_demand_requests_program_code_format
  check (program_code ~ '^[A-Z0-9]{2,4}$');

-- 3) generate_certificate_code — accept A–Z and 0–9
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
    raise exception 'Geçersiz program kodu. 2–4 karakter kullanın (A–Z, 0–9; ör. DC, 3DTY).';
  end if;

  if v_program_code !~ '^[A-Z0-9]{2,4}$' then
    raise exception 'Geçersiz program kodu. Yalnızca A–Z ve 0–9 karakterlere izin verilir (ör. DC, 3DTY).';
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
