-- D2P Academy | Migration 026
-- Fix admin audit log student/event names on certificate revoke + backfill.

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
  v_reason text := nullif(trim(p_revoke_reason), '');
  v_actor_email text;
  v_student_name text;
  v_student_email text;
  v_event_title text;
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

  -- Capture display fields BEFORE deleting the certificate row.
  select p.email into v_actor_email
  from public.profiles p
  where p.id = auth.uid();

  select
    nullif(trim(p.full_name), ''),
    nullif(trim(p.email), ''),
    nullif(trim(ev.title), '')
  into
    v_student_name,
    v_student_email,
    v_event_title
  from public.enrollments en
  join public.profiles p on p.id = en.user_id
  join public.events ev on ev.id = en.event_id
  where en.id = v_certificate.enrollment_id;

  -- Fallback if enrollment join somehow misses.
  if v_student_name is null or v_event_title is null then
    select
      coalesce(v_student_name, nullif(trim(p.full_name), '')),
      coalesce(v_student_email, nullif(trim(p.email), '')),
      coalesce(v_event_title, nullif(trim(ev.title), ''))
    into
      v_student_name,
      v_student_email,
      v_event_title
    from public.profiles p
    cross join public.events ev
    where p.id = v_certificate.user_id
      and ev.id = v_certificate.event_id;
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
    left(concat('revoke:', coalesce(v_reason, 'admin')), 500)
  );

  insert into public.admin_audit_logs (
    action,
    actor_id,
    actor_email,
    reason,
    enrollment_id,
    event_id,
    event_title,
    student_id,
    student_name,
    student_email,
    certificate_code,
    metadata
  )
  values (
    'certificate_revoked',
    auth.uid(),
    v_actor_email,
    coalesce(v_reason, 'Belirtilmedi'),
    v_certificate.enrollment_id,
    v_certificate.event_id,
    v_event_title,
    v_certificate.user_id,
    v_student_name,
    v_student_email,
    v_certificate.certificate_code,
    jsonb_build_object(
      'source', 'revoke_certificate',
      'student_name', to_jsonb(v_student_name),
      'event_title', to_jsonb(v_event_title)
    )
  );
end;
$$;

grant execute on function public.revoke_certificate(uuid, text) to authenticated;

-- Backfill names for rows that already have student_id / event_id.
update public.admin_audit_logs a
set
  student_name = coalesce(a.student_name, nullif(trim(p.full_name), '')),
  student_email = coalesce(a.student_email, nullif(trim(p.email), ''))
from public.profiles p
where a.student_id = p.id
  and (a.student_name is null or a.student_email is null);

update public.admin_audit_logs a
set event_title = coalesce(a.event_title, nullif(trim(e.title), ''))
from public.events e
where a.event_id = e.id
  and a.event_title is null;
