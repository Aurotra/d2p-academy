-- D2P Academy | Migration 087
-- Coupon / discount codes + atomic redemption on successful payment.

-- ---------------------------------------------------------------------------
-- 1) coupons
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_rate numeric(5, 2) not null
    check (discount_rate > 0 and discount_rate <= 100),
  max_uses integer
    check (max_uses is null or max_uses > 0),
  used_count integer not null default 0
    check (used_count >= 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Case-insensitive unique code (stored uppercase by app/RPC)
create unique index if not exists coupons_code_upper_uidx
  on public.coupons (upper(code));

create index if not exists coupons_is_active_idx
  on public.coupons (is_active)
  where is_active = true;

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

comment on table public.coupons is 'Percent discount codes for paid event card checkout.';
comment on column public.coupons.discount_rate is 'Percent off list price (e.g. 15.00 = %15).';
comment on column public.coupons.max_uses is 'Null = unlimited redemptions.';
comment on column public.coupons.used_count is 'Incremented only after successful payment via RPC.';

-- ---------------------------------------------------------------------------
-- 2) payments: optional coupon snapshot (amount still charged is amount_try_cents)
-- ---------------------------------------------------------------------------
alter table public.payments
  add column if not exists coupon_id uuid references public.coupons (id) on delete set null;

alter table public.payments
  add column if not exists coupon_code text;

alter table public.payments
  add column if not exists original_amount_try_cents integer;

alter table public.payments
  add column if not exists discount_try_cents integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_original_amount_nonneg'
  ) then
    alter table public.payments
      add constraint payments_original_amount_nonneg
      check (original_amount_try_cents is null or original_amount_try_cents >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'payments_discount_nonneg'
  ) then
    alter table public.payments
      add constraint payments_discount_nonneg
      check (discount_try_cents is null or discount_try_cents >= 0);
  end if;
end $$;

-- Allow zero-amount paid rows for 100% coupon redemptions (no card gateway).
alter table public.payments drop constraint if exists payments_amount_try_cents_check;
alter table public.payments
  add constraint payments_amount_try_cents_check
  check (amount_try_cents >= 0);

create index if not exists payments_coupon_id_idx
  on public.payments (coupon_id)
  where coupon_id is not null;

-- ---------------------------------------------------------------------------
-- 3) coupon_redemptions (payment_id = project "order"; amounts in kuruş)
-- ---------------------------------------------------------------------------
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete restrict,
  payment_id uuid references public.payments (id) on delete set null,
  original_amount_try_cents integer not null check (original_amount_try_cents >= 0),
  discount_amount_try_cents integer not null check (discount_amount_try_cents >= 0),
  final_amount_try_cents integer not null check (final_amount_try_cents >= 0),
  customer_email text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists coupon_redemptions_payment_id_uidx
  on public.coupon_redemptions (payment_id)
  where payment_id is not null;

create index if not exists coupon_redemptions_coupon_id_idx
  on public.coupon_redemptions (coupon_id);

create index if not exists coupon_redemptions_created_at_idx
  on public.coupon_redemptions (created_at desc);

comment on table public.coupon_redemptions is
  'Successful coupon uses. written only by record_successful_coupon_redemption.';

-- ---------------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------------
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all"
on public.coupons for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "coupon_redemptions_admin_select" on public.coupon_redemptions;
create policy "coupon_redemptions_admin_select"
on public.coupon_redemptions for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Writes only via service_role / security definer RPC.

-- ---------------------------------------------------------------------------
-- 5) Atomic redemption RPC (FOR UPDATE + increment + insert)
-- ---------------------------------------------------------------------------
create or replace function public.record_successful_coupon_redemption(
  p_coupon_id uuid,
  p_payment_id uuid,
  p_original_amount_try_cents integer,
  p_discount_amount_try_cents integer,
  p_final_amount_try_cents integer,
  p_customer_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons%rowtype;
  v_redemption_id uuid;
  v_existing_id uuid;
begin
  if p_coupon_id is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'COUPON_REQUIRED',
      'error_message', 'Kupon kimliği zorunludur.'
    );
  end if;

  if p_original_amount_try_cents is null
     or p_discount_amount_try_cents is null
     or p_final_amount_try_cents is null
     or p_original_amount_try_cents < 0
     or p_discount_amount_try_cents < 0
     or p_final_amount_try_cents < 0 then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'INVALID_AMOUNTS',
      'error_message', 'Geçersiz tutar bilgisi.'
    );
  end if;

  -- Idempotent: same payment already redeemed
  if p_payment_id is not null then
    select r.id
    into v_existing_id
    from public.coupon_redemptions r
    where r.payment_id = p_payment_id
    limit 1;

    if v_existing_id is not null then
      return jsonb_build_object(
        'ok', true,
        'already_recorded', true,
        'redemption_id', v_existing_id
      );
    end if;
  end if;

  select *
  into v_coupon
  from public.coupons
  where id = p_coupon_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'COUPON_NOT_FOUND',
      'error_message', 'İndirim kodu bulunamadı.'
    );
  end if;

  -- Payment-backed redemption: checkout already locked in the discounted amount.
  -- Skip active/expiry/max checks so a successful card payment is never stranded.
  -- Soft limits are enforced at validate + enroll start only.
  if p_payment_id is null then
    if not v_coupon.is_active then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'COUPON_INACTIVE',
        'error_message', 'Bu indirim kodu artık geçerli değil.'
      );
    end if;

    if v_coupon.expires_at is not null and v_coupon.expires_at <= timezone('utc', now()) then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'COUPON_EXPIRED',
        'error_message', 'Bu indirim kodunun süresi dolmuş.'
      );
    end if;

    if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'COUPON_EXHAUSTED',
        'error_message', 'Bu indirim kodunun kullanım limiti dolmuş.'
      );
    end if;
  end if;

  update public.coupons
  set used_count = used_count + 1,
      updated_at = timezone('utc', now())
  where id = p_coupon_id;

  insert into public.coupon_redemptions (
    coupon_id,
    payment_id,
    original_amount_try_cents,
    discount_amount_try_cents,
    final_amount_try_cents,
    customer_email
  )
  values (
    p_coupon_id,
    p_payment_id,
    p_original_amount_try_cents,
    p_discount_amount_try_cents,
    p_final_amount_try_cents,
    nullif(trim(p_customer_email), '')
  )
  returning id into v_redemption_id;

  return jsonb_build_object(
    'ok', true,
    'already_recorded', false,
    'redemption_id', v_redemption_id,
    'used_count', v_coupon.used_count + 1
  );
exception
  when unique_violation then
    -- Concurrent finalize for same payment_id
    if p_payment_id is not null then
      select r.id
      into v_existing_id
      from public.coupon_redemptions r
      where r.payment_id = p_payment_id
      limit 1;

      if v_existing_id is not null then
        return jsonb_build_object(
          'ok', true,
          'already_recorded', true,
          'redemption_id', v_existing_id
        );
      end if;
    end if;
    return jsonb_build_object(
      'ok', false,
      'error_code', 'REDEMPTION_CONFLICT',
      'error_message', 'Kupon kullanımı kaydedilemedi.'
    );
end;
$$;

grant execute on function public.record_successful_coupon_redemption(
  uuid, uuid, integer, integer, integer, text
) to service_role;
