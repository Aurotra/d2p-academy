-- D2P Academy | Migration 089
-- Magaza (store) orders + PayTR fields. Idempotent.

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  status text not null default 'pending_payment'
    check (
      status in (
        'pending_payment',
        'paid',
        'processing',
        'shipped',
        'completed',
        'failed',
        'cancelled',
        'refunded'
      )
    ),
  product_id text not null,
  product_slug text not null,
  product_title text not null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 20),
  unit_price_try_cents integer not null check (unit_price_try_cents >= 0),
  amount_try_cents integer not null check (amount_try_cents >= 0),
  currency text not null default 'TRY',
  customer_user_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_city text not null,
  shipping_district text,
  shipping_address text not null,
  customer_note text,
  provider text not null default 'paytr',
  provider_conversation_id text,
  provider_token text,
  provider_payment_id text,
  provider_raw jsonb,
  paid_at timestamptz,
  shipped_at timestamptz,
  tracking_number text,
  admin_note text,
  notified_admin_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists store_orders_order_number_uidx
  on public.store_orders (order_number);

create unique index if not exists store_orders_provider_conversation_uidx
  on public.store_orders (provider, provider_conversation_id)
  where provider_conversation_id is not null;

create index if not exists store_orders_status_idx on public.store_orders (status);
create index if not exists store_orders_created_at_idx on public.store_orders (created_at desc);
create index if not exists store_orders_customer_email_idx on public.store_orders (customer_email);

comment on table public.store_orders is
  'Magaza ürün siparişleri; PayTR tahsilatı enrollment payments tablosundan ayrıdır.';

alter table public.store_orders enable row level security;

drop policy if exists store_orders_admin_all on public.store_orders;
create policy store_orders_admin_all
  on public.store_orders
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.is_active = true
    )
  );

drop policy if exists store_orders_customer_select on public.store_orders;
create policy store_orders_customer_select
  on public.store_orders
  for select
  to authenticated
  using (customer_user_id = auth.uid());
