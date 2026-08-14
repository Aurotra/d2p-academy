-- D2P Academy | Migration 081
-- FAZ 1: events.payment_mode (+ display_price_try_cents). Keep is_paid; sync via trigger.
-- No enroll/UI behavior change — readers continue to use is_paid.

-- 1) Columns
alter table public.events
  add column if not exists payment_mode text;

alter table public.events
  add column if not exists display_price_try_cents integer;

-- 2) Backfill before NOT NULL (never assign 'external' automatically)
update public.events
set payment_mode = case when is_paid then 'iyzico' else 'free' end
where payment_mode is null;

alter table public.events
  alter column payment_mode set default 'free';

alter table public.events
  alter column payment_mode set not null;

-- 3) Checks
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_payment_mode_check'
  ) then
    alter table public.events
      add constraint events_payment_mode_check
      check (payment_mode in ('free', 'iyzico', 'external'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_payment_mode_iyzico_requires_price'
  ) then
    alter table public.events
      add constraint events_payment_mode_iyzico_requires_price
      check (
        payment_mode is distinct from 'iyzico'
        or (price_try_cents is not null and price_try_cents > 0)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_display_price_try_cents_nonneg'
  ) then
    alter table public.events
      add constraint events_display_price_try_cents_nonneg
      check (display_price_try_cents is null or display_price_try_cents >= 0);
  end if;
end $$;

comment on column public.events.payment_mode is
  'free | iyzico | external. FAZ1: kept in sync with is_paid (iyzico<=>true). external never auto-backfilled.';
comment on column public.events.display_price_try_cents is
  'Optional display-only price (kuruş) for external/info; never triggers checkout.';
comment on column public.events.is_paid is
  'Legacy boolean mirror of payment_mode=iyzico. Prefer payment_mode going forward; kept for FAZ1 readers.';

create index if not exists events_payment_mode_idx
  on public.events (payment_mode);

-- 4) Sync trigger (is_paid cannot become GENERATED without DROP — keep column + trigger)
create or replace function public.sync_event_payment_mode_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.payment_mode = 'external' then
      new.is_paid := false;
    elsif new.payment_mode = 'iyzico' then
      new.is_paid := true;
    elsif new.is_paid then
      new.payment_mode := 'iyzico';
      new.is_paid := true;
    else
      new.payment_mode := 'free';
      new.is_paid := false;
    end if;
  elsif new.payment_mode is distinct from old.payment_mode then
    -- payment_mode is source of truth when explicitly changed
    new.is_paid := (new.payment_mode = 'iyzico');
  elsif new.is_paid is distinct from old.is_paid then
    -- legacy / FAZ1 writers still toggle is_paid
    if new.payment_mode is distinct from 'external' then
      new.payment_mode := case when new.is_paid then 'iyzico' else 'free' end;
    end if;
    new.is_paid := (new.payment_mode = 'iyzico');
  else
    new.is_paid := (new.payment_mode = 'iyzico');
  end if;

  return new;
end;
$$;

drop trigger if exists events_sync_payment_mode_fields on public.events;
create trigger events_sync_payment_mode_fields
before insert or update on public.events
for each row
execute function public.sync_event_payment_mode_fields();
