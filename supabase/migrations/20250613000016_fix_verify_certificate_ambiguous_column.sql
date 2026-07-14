-- D2P Academy | Migration 016
-- Fix verify_certificate: ambiguous "certificate_code" with RETURNS TABLE out-params.

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
  v_result_code text;
  v_result_issued_at timestamptz;
  v_result_status public.certificate_status;
begin
  select c.*
  into v_certificate
  from public.certificates c
  where c.certificate_code = v_normalized_code;

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

  v_result_code := coalesce(v_certificate.certificate_code, v_normalized_code);
  v_result_issued_at := case
    when v_is_valid then v_certificate.issued_at
    else null::timestamptz
  end;
  v_result_status := case
    when v_is_valid then v_certificate.status
    else null::public.certificate_status
  end;

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

  -- Assign OUT columns explicitly to avoid RETURN QUERY name ambiguity.
  is_valid := v_is_valid;
  certificate_code := v_result_code;
  holder_name := v_holder_name;
  event_title := v_event_title;
  issued_at := v_result_issued_at;
  status := v_result_status;
  return next;
end;
$$;

grant execute on function public.verify_certificate(text, text, text) to anon, authenticated;
