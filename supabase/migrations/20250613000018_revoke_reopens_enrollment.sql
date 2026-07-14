-- D2P Academy | Migration 018
-- On certificate revoke: also reopen enrollment (completed → attended)
-- so the "Tamamlandı" action returns in admin enrollments UI.

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

  -- Undo completion so admin must mark Tamamlandı again before re-issue.
  update public.enrollments
  set
    status = 'attended'::public.enrollment_status,
    completed_at = null,
    updated_at = timezone('utc', now())
  where id = v_certificate.enrollment_id
    and status = 'completed'::public.enrollment_status;

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

grant execute on function public.revoke_certificate(uuid, text) to authenticated;

-- Repair current orphans: completed enrollments with no certificate row
-- (already revoked/deleted, e.g. Sude after migration 017).
update public.enrollments e
set
  status = 'attended'::public.enrollment_status,
  completed_at = null,
  updated_at = timezone('utc', now())
where e.status = 'completed'::public.enrollment_status
  and not exists (
    select 1
    from public.certificates c
    where c.enrollment_id = e.id
  );
