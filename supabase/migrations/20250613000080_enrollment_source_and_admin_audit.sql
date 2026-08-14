-- D2P Academy | Migration 080
-- enrollment_source on enrollments + reserve_event_enrollment writes it; backfill legacy rows.

-- 1) Column + check
alter table public.enrollments
  add column if not exists enrollment_source text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'enrollments_enrollment_source_check'
  ) then
    alter table public.enrollments
      add constraint enrollments_enrollment_source_check
      check (
        enrollment_source is null
        or enrollment_source in ('parent', 'self', 'admin_manual', 'unknown_legacy')
      );
  end if;
end $$;

comment on column public.enrollments.enrollment_source is
  'How the seat was created: parent (incl. iyzico checkout), self, admin_manual, unknown_legacy.';

create index if not exists enrollments_enrollment_source_idx
  on public.enrollments (enrollment_source)
  where enrollment_source is not null;

-- 2) Backfill
-- Paid checkout / parent payment path
update public.enrollments e
set enrollment_source = 'parent'
where e.enrollment_source is null
  and exists (
    select 1
    from public.payments p
    where p.enrollment_id = e.id
      and p.status = 'paid'
  );

-- Student self-enroll logged as member activity (actor = student)
update public.enrollments e
set enrollment_source = 'self'
where e.enrollment_source is null
  and exists (
    select 1
    from public.admin_audit_logs a
    where a.action = 'enrollment_created'
      and a.enrollment_id = e.id
      and a.student_id = e.user_id
      and a.actor_id = e.user_id
      and coalesce((a.metadata ->> 'source'), '') = 'member_activity'
  );

-- Remaining historical rows cannot be attributed reliably (admin never audited create before)
update public.enrollments e
set enrollment_source = 'unknown_legacy'
where e.enrollment_source is null;

alter table public.enrollments
  alter column enrollment_source set default 'unknown_legacy';

alter table public.enrollments
  alter column enrollment_source set not null;

-- 3) Replace reserve RPC to accept + write enrollment_source
drop function if exists public.reserve_event_enrollment(uuid, uuid, public.enrollment_status);

create or replace function public.reserve_event_enrollment(
  p_event_id uuid,
  p_user_id uuid,
  p_target_status public.enrollment_status default 'registered'::public.enrollment_status,
  p_enrollment_source text default 'unknown_legacy'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_capacity integer;
  v_existing_id uuid;
  v_existing_status public.enrollment_status;
  v_hold_count integer;
  v_user_holds boolean := false;
  v_enrollment_id uuid;
  v_source text;
begin
  v_source := coalesce(nullif(trim(p_enrollment_source), ''), 'unknown_legacy');
  if v_source not in ('parent', 'self', 'admin_manual', 'unknown_legacy') then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'INVALID_SOURCE',
      'error_message', 'Geçersiz kayıt kaynağı.'
    );
  end if;

  if p_target_status is distinct from 'registered'::public.enrollment_status
     and p_target_status is distinct from 'pending_payment'::public.enrollment_status then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'INVALID_STATUS',
      'error_message', 'Geçersiz kayıt durumu.'
    );
  end if;

  if not public.is_event_participant_profile(p_user_id) then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'NOT_PARTICIPANT',
      'error_message', 'Etkinliğe yalnızca kullanıcı adlı öğrenci hesapları kaydolabilir.'
    );
  end if;

  select e.max_capacity
  into v_max_capacity
  from public.events e
  where e.id = p_event_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'EVENT_NOT_FOUND',
      'error_message', 'Etkinlik bulunamadı.'
    );
  end if;

  select en.id, en.status
  into v_existing_id, v_existing_status
  from public.enrollments en
  where en.user_id = p_user_id
    and en.event_id = p_event_id
  for update;

  if v_existing_id is not null then
    if v_existing_status in (
      'registered'::public.enrollment_status,
      'attended'::public.enrollment_status,
      'completed'::public.enrollment_status
    ) then
      return jsonb_build_object(
        'ok', true,
        'enrollment_id', v_existing_id,
        'already_enrolled', true,
        'revived', false,
        'status', v_existing_status::text
      );
    end if;

    if v_existing_status = 'pending_payment'::public.enrollment_status then
      v_user_holds := true;
      if p_target_status = 'pending_payment'::public.enrollment_status then
        update public.enrollments
        set enrollment_source = v_source,
            updated_at = timezone('utc', now())
        where id = v_existing_id
          and enrollment_source is distinct from v_source;

        return jsonb_build_object(
          'ok', true,
          'enrollment_id', v_existing_id,
          'already_enrolled', false,
          'revived', false,
          'status', 'pending_payment'
        );
      end if;

      update public.enrollments
      set status = 'registered'::public.enrollment_status,
          enrollment_source = v_source,
          completed_at = null,
          updated_at = timezone('utc', now())
      where id = v_existing_id;

      return jsonb_build_object(
        'ok', true,
        'enrollment_id', v_existing_id,
        'already_enrolled', false,
        'revived', true,
        'status', 'registered'
      );
    end if;
  end if;

  select count(*)::integer
  into v_hold_count
  from public.enrollments en
  join public.profiles p on p.id = en.user_id
  where en.event_id = p_event_id
    and en.status in (
      'pending_payment'::public.enrollment_status,
      'registered'::public.enrollment_status,
      'attended'::public.enrollment_status,
      'completed'::public.enrollment_status
    )
    and p.role = 'student'::public.user_role
    and nullif(trim(p.username), '') is not null;

  if not v_user_holds
     and v_max_capacity is not null
     and v_max_capacity > 0
     and v_hold_count >= v_max_capacity then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'CAPACITY_FULL',
      'error_message', format('Bu etkinliğin kontenjanı dolu (%s kişi).', v_max_capacity)
    );
  end if;

  if v_existing_id is not null then
    update public.enrollments
    set status = p_target_status,
        enrollment_source = v_source,
        completed_at = null,
        updated_at = timezone('utc', now())
    where id = v_existing_id
    returning id into v_enrollment_id;

    return jsonb_build_object(
      'ok', true,
      'enrollment_id', v_enrollment_id,
      'already_enrolled', false,
      'revived', true,
      'status', p_target_status::text
    );
  end if;

  insert into public.enrollments (user_id, event_id, status, enrollment_source)
  values (p_user_id, p_event_id, p_target_status, v_source)
  returning id into v_enrollment_id;

  return jsonb_build_object(
    'ok', true,
    'enrollment_id', v_enrollment_id,
    'already_enrolled', false,
    'revived', false,
    'status', p_target_status::text
  );
exception
  when unique_violation then
    select en.id, en.status
    into v_existing_id, v_existing_status
    from public.enrollments en
    where en.user_id = p_user_id
      and en.event_id = p_event_id;

    if v_existing_id is not null
       and v_existing_status in (
         'registered'::public.enrollment_status,
         'attended'::public.enrollment_status,
         'completed'::public.enrollment_status,
         'pending_payment'::public.enrollment_status
       ) then
      return jsonb_build_object(
        'ok', true,
        'enrollment_id', v_existing_id,
        'already_enrolled', v_existing_status is distinct from 'pending_payment'::public.enrollment_status
          or p_target_status is distinct from 'pending_payment'::public.enrollment_status,
        'revived', false,
        'status', v_existing_status::text
      );
    end if;

    return jsonb_build_object(
      'ok', false,
      'error_code', 'CONFLICT',
      'error_message', 'Kayıt oluşturulamadı.'
    );
end;
$$;

revoke all on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status, text) from public;
grant execute on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status, text) to service_role;
grant execute on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status, text) to authenticated;

comment on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status, text) is
  'Atomically lock event, enforce capacity, insert/revive enrollment with enrollment_source.';
