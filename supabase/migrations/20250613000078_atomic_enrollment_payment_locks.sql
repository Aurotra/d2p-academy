-- D2P Academy | Migration 078
-- Atomic capacity reserve + locked payment finalize/stale cancel (race fixes).

-- ---------------------------------------------------------------------------
-- 1) reserve_event_enrollment: lock event row, count holds, insert/update
-- ---------------------------------------------------------------------------
create or replace function public.reserve_event_enrollment(
  p_event_id uuid,
  p_user_id uuid,
  p_target_status public.enrollment_status default 'registered'::public.enrollment_status
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
begin
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
        return jsonb_build_object(
          'ok', true,
          'enrollment_id', v_existing_id,
          'already_enrolled', false,
          'revived', false,
          'status', 'pending_payment'
        );
      end if;
      -- pending_payment → registered (free path / admin upgrade): seat already held
      update public.enrollments
      set status = 'registered'::public.enrollment_status,
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

  insert into public.enrollments (user_id, event_id, status)
  values (p_user_id, p_event_id, p_target_status)
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

revoke all on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status) from public;
grant execute on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status) to service_role;
grant execute on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) finalize_iyzico_payment: lock payment, recover cancelled/failed if needed
-- ---------------------------------------------------------------------------
create or replace function public.finalize_iyzico_payment(
  p_payment_id uuid,
  p_provider_payment_id text,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_recovered boolean := false;
  v_enrollment_id uuid;
  v_student_user_id uuid;
begin
  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'PAYMENT_NOT_FOUND',
      'error_message', 'Ödeme kaydı bulunamadı.'
    );
  end if;

  v_enrollment_id := v_payment.enrollment_id;
  v_student_user_id := v_payment.student_user_id;

  if v_payment.status = 'paid' then
    -- Ensure enrollment is registered even on replay
    update public.enrollments
    set status = 'registered'::public.enrollment_status,
        completed_at = null,
        updated_at = timezone('utc', now())
    where id = v_enrollment_id
      and status in (
        'pending_payment'::public.enrollment_status,
        'cancelled'::public.enrollment_status
      );

    return jsonb_build_object(
      'ok', true,
      'already_paid', true,
      'recovered', false,
      'enrollment_id', v_enrollment_id,
      'student_user_id', v_student_user_id
    );
  end if;

  if v_payment.status in ('cancelled', 'failed') then
    v_recovered := true;
  elsif v_payment.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'INVALID_PAYMENT_STATUS',
      'error_message', format('Ödeme durumu işlenemez: %s', v_payment.status),
      'payment_status', v_payment.status
    );
  end if;

  -- Lock enrollment row before mutating both sides
  perform 1
  from public.enrollments
  where id = v_enrollment_id
  for update;

  update public.payments
  set status = 'paid',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      provider_raw = coalesce(p_raw, provider_raw),
      paid_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = p_payment_id;

  update public.enrollments
  set status = 'registered'::public.enrollment_status,
      completed_at = null,
      updated_at = timezone('utc', now())
  where id = v_enrollment_id
    and status in (
      'pending_payment'::public.enrollment_status,
      'cancelled'::public.enrollment_status,
      'registered'::public.enrollment_status
    );

  return jsonb_build_object(
    'ok', true,
    'already_paid', false,
    'recovered', v_recovered,
    'enrollment_id', v_enrollment_id,
    'student_user_id', v_student_user_id,
    'previous_payment_status', v_payment.status
  );
end;
$$;

revoke all on function public.finalize_iyzico_payment(uuid, text, jsonb) from public;
grant execute on function public.finalize_iyzico_payment(uuid, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 3) cancel_stale_pending_payment: lock payment; skip if already paid
-- ---------------------------------------------------------------------------
create or replace function public.cancel_stale_pending_payment(
  p_payment_id uuid,
  p_also_cancel_enrollment boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
begin
  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_found');
  end if;

  if v_payment.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', true,
      'skipped', true,
      'reason', 'not_pending',
      'payment_status', v_payment.status
    );
  end if;

  if p_also_cancel_enrollment then
    perform 1
    from public.enrollments
    where id = v_payment.enrollment_id
    for update;
  end if;

  update public.payments
  set status = 'cancelled',
      updated_at = timezone('utc', now())
  where id = p_payment_id
    and status = 'pending';

  if p_also_cancel_enrollment then
    update public.enrollments
    set status = 'cancelled'::public.enrollment_status,
        updated_at = timezone('utc', now())
    where id = v_payment.enrollment_id
      and status = 'pending_payment'::public.enrollment_status;
  end if;

  return jsonb_build_object(
    'ok', true,
    'skipped', false,
    'payment_id', p_payment_id,
    'enrollment_id', v_payment.enrollment_id,
    'enrollment_cancelled', p_also_cancel_enrollment
  );
end;
$$;

revoke all on function public.cancel_stale_pending_payment(uuid, boolean) from public;
grant execute on function public.cancel_stale_pending_payment(uuid, boolean) to service_role;

-- Back-compat single-arg overload
create or replace function public.cancel_stale_pending_payment(p_payment_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.cancel_stale_pending_payment(p_payment_id, true);
$$;

revoke all on function public.cancel_stale_pending_payment(uuid) from public;
grant execute on function public.cancel_stale_pending_payment(uuid) to service_role;

comment on function public.reserve_event_enrollment(uuid, uuid, public.enrollment_status) is
  'Atomically lock event, enforce capacity, insert/revive enrollment (registered|pending_payment).';
comment on function public.finalize_iyzico_payment(uuid, text, jsonb) is
  'Lock payment row; mark paid and enrollment registered; recover cancelled/failed if provider succeeded.';
comment on function public.cancel_stale_pending_payment(uuid) is
  'Lock payment; cancel only if still pending (no-op if paid — avoids stale×callback race).';
