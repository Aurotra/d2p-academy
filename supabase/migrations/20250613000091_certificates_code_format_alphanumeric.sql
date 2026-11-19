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
  v_yy text;
  v_seq bigint;
  v_year integer;
begin
  if v_code ~ '^D2P-[A-Z0-9]{2,4}-[0-9]{2}-[0-9]{5}$' then
    v_program := split_part(v_code, '-', 2);
    v_yy := split_part(v_code, '-', 3);
    v_seq := split_part(v_code, '-', 4)::bigint;
    v_year := 2000 + v_yy::integer;

    update public.certificate_code_sequences
    set last_value = greatest(last_value, v_seq)
    where program_code = v_program
      and issue_year = v_year;
  end if;
end;
$$;
