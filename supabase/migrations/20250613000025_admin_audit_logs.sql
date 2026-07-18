-- D2P Academy | Migration 025
-- Admin audit logs for enrollment deletes and certificate revokes.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null
    check (action in ('enrollment_deleted', 'certificate_revoked')),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  reason text,
  enrollment_id uuid,
  event_id uuid,
  event_title text,
  student_id uuid,
  student_name text,
  student_email text,
  certificate_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs (action, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_admin_select on public.admin_audit_logs;
create policy admin_audit_logs_admin_select
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists admin_audit_logs_admin_insert on public.admin_audit_logs;
create policy admin_audit_logs_admin_insert
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- revoke_certificate: keep reclaim/student_code behavior + structured audit log
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

  select email into v_actor_email from public.profiles where id = auth.uid();
  select full_name, email into v_student_name, v_student_email
  from public.profiles where id = v_certificate.user_id;
  select title into v_event_title from public.events where id = v_certificate.event_id;

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
    jsonb_build_object('source', 'revoke_certificate')
  );
end;
$$;

grant execute on function public.revoke_certificate(uuid, text) to authenticated;

-- Backfill past revoke reasons buried in verification log user_agent.
insert into public.admin_audit_logs (
  action,
  reason,
  certificate_code,
  created_at,
  metadata
)
select
  'certificate_revoked',
  nullif(trim(both from substring(l.user_agent from length('revoke:') + 1)), ''),
  l.certificate_code,
  l.verified_at,
  jsonb_build_object('source', 'verification_logs_backfill', 'verification_log_id', l.id)
from public.certificate_verification_logs l
where l.user_agent like 'revoke:%'
  and not exists (
    select 1
    from public.admin_audit_logs a
    where a.action = 'certificate_revoked'
      and a.certificate_code = l.certificate_code
      and a.created_at = l.verified_at
  );
