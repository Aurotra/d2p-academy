-- Allow alphanumeric program codes in certificate_code (e.g. D2P-3DMO-26-00100).

alter table public.certificates
  drop constraint if exists certificates_code_format;

alter table public.certificates
  add constraint certificates_code_format check (
    certificate_code ~* '^D2P-[0-9]{4}-[0-9]{4,}$'
    or certificate_code ~* '^D2P-[A-Z0-9]{2,4}-[0-9]{2}-[0-9]{5}$'
  );

-- Keep reclaim helper aligned with alphanumeric program codes.
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
  -- New format: D2P-{CODE}-{YY}-{#####} (CODE may include digits, e.g. 3DMO)
  if v_code ~ '^D2P-[A-Z0-9]{2,4}-[0-9]{2}-[0-9]{5}$' then
    v_program := (regexp_match(v_code, '^D2P-([A-Z0-9]{2,4})-'))[1];
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
