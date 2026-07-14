-- D2P Academy | Migration 019
-- mask_full_name: keep all name parts; mask 2nd+ given names and surname.

create or replace function public.mask_full_name(p_full_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_parts text[];
  v_result text := '';
  v_part text;
  v_i integer;
  v_len integer;
begin
  v_parts := regexp_split_to_array(trim(both from coalesce(p_full_name, '')), '\s+');
  v_len := coalesce(array_length(v_parts, 1), 0);

  if v_len = 0 or v_parts[1] is null or v_parts[1] = '' then
    return '***';
  end if;

  -- Single token: mask like before (privacy).
  if v_len = 1 then
    return left(v_parts[1], 1) || repeat('*', greatest(char_length(v_parts[1]) - 1, 2));
  end if;

  -- First given name fully visible; every later part (2nd name, surname, …) masked.
  v_result := v_parts[1];

  for v_i in 2 .. v_len loop
    v_part := v_parts[v_i];
    v_result := v_result || ' ' || left(v_part, 1)
      || repeat('*', greatest(char_length(v_part) - 1, 2));
  end loop;

  return v_result;
end;
$$;
