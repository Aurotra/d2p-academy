-- D2P Academy | Migration 028
-- Kaklık 3D Yaz Kursu campaign fields on registrations.

alter table public.registrations
  add column if not exists email text;

alter table public.registrations
  add column if not exists time_group text;

alter table public.registrations
  add column if not exists campaign text;

alter table public.registrations
  drop constraint if exists registrations_time_group_check;

alter table public.registrations
  add constraint registrations_time_group_check
  check (
    time_group is null
    or time_group in ('group_1', 'group_2', 'group_3')
  );

-- Same phone may register for different campaigns; unique per campaign.
alter table public.registrations
  drop constraint if exists registrations_phone_unique;

drop index if exists registrations_phone_campaign_unique;
create unique index registrations_phone_campaign_unique
  on public.registrations (phone, coalesce(campaign, ''));

create index if not exists registrations_campaign_idx
  on public.registrations (campaign);

create index if not exists registrations_time_group_idx
  on public.registrations (time_group);
