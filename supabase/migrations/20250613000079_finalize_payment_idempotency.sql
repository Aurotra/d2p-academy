-- D2P Academy | Migration 079
-- Tighten finalize_iyzico_payment idempotency: pure no-op when already paid;
-- treat provider_payment_id unique conflicts as already-processed.

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

  -- Idempotent replay: no payment/enrollment writes, no recovery.
  if v_payment.status = 'paid' then
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

  perform 1
  from public.enrollments
  where id = v_enrollment_id
  for update;

  begin
    update public.payments
    set status = 'paid',
        provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
        provider_raw = coalesce(p_raw, provider_raw),
        paid_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where id = p_payment_id;
  exception
    when unique_violation then
      -- Same iyzico payment id already stored (usually this row after concurrent finalize).
      select *
      into v_payment
      from public.payments
      where id = p_payment_id
      for update;

      if v_payment.status = 'paid' then
        return jsonb_build_object(
          'ok', true,
          'already_paid', true,
          'recovered', false,
          'enrollment_id', v_payment.enrollment_id,
          'student_user_id', v_payment.student_user_id
        );
      end if;

      return jsonb_build_object(
        'ok', false,
        'error_code', 'PROVIDER_PAYMENT_ID_CONFLICT',
        'error_message', 'Ödeme sağlayıcı kimliği çakışması.'
      );
  end;

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

comment on function public.finalize_iyzico_payment(uuid, text, jsonb) is
  'Lock payment; mark paid + enrollment registered; already_paid is a pure no-op; unique provider_payment_id → already_paid when row is paid.';
