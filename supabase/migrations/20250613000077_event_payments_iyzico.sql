-- D2P Academy | Migration 077
-- Paid events + iyzico payments. Idempotent.

-- 1) enrollment_status: pending_payment (holds seat until paid or cancelled)
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'enrollment_status'
      and e.enumlabel = 'pending_payment'
  ) then
    alter type public.enrollment_status add value 'pending_payment' before 'registered';
  end if;
end $$;

-- 2) events: paid flag + price in kuruş (TRY)
alter table public.events
  add column if not exists is_paid boolean not null default false;

alter table public.events
  add column if not exists price_try_cents integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_price_try_cents_nonneg'
  ) then
    alter table public.events
      add constraint events_price_try_cents_nonneg
      check (price_try_cents is null or price_try_cents >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_paid_requires_price'
  ) then
    alter table public.events
      add constraint events_paid_requires_price
      check (
        (is_paid = false)
        or (is_paid = true and price_try_cents is not null and price_try_cents > 0)
      );
  end if;
end $$;

comment on column public.events.is_paid is 'When true, enrollment stays pending_payment until iyzico payment succeeds.';
comment on column public.events.price_try_cents is 'Event fee in TRY kuruş (15000 = 150.00 TL).';

-- 3) payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete restrict,
  payer_user_id uuid not null references public.profiles (id) on delete restrict,
  student_user_id uuid not null references public.profiles (id) on delete restrict,
  amount_try_cents integer not null check (amount_try_cents > 0),
  currency text not null default 'TRY',
  provider text not null default 'iyzico',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  provider_conversation_id text,
  provider_token text,
  provider_payment_id text,
  provider_raw jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payments_enrollment_id_idx on public.payments (enrollment_id);
create index if not exists payments_payer_user_id_idx on public.payments (payer_user_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_provider_token_idx on public.payments (provider_token)
  where provider_token is not null;
create unique index if not exists payments_provider_payment_id_uidx
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
on public.payments for select to authenticated
using (
  payer_user_id = auth.uid()
  or student_user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Writes go through service role / server APIs only.
drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all"
on public.payments for all to authenticated
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

grant select on public.payments to authenticated;
grant all on public.payments to service_role;
