-- D2P Academy | Migration 053
-- Allow multiple instructors per event via junction table.

create table if not exists public.event_instructors (
  event_id uuid not null references public.events (id) on delete cascade,
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (event_id, instructor_id)
);

create index if not exists event_instructors_instructor_id_idx
  on public.event_instructors (instructor_id);

create index if not exists event_instructors_event_id_idx
  on public.event_instructors (event_id);

insert into public.event_instructors (event_id, instructor_id, sort_order)
select e.id, e.instructor_id, 0
from public.events e
where e.instructor_id is not null
on conflict (event_id, instructor_id) do nothing;

create or replace function public.event_has_instructor(
  p_event_id uuid,
  p_instructor_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_instructors ei
    where ei.event_id = p_event_id
      and ei.instructor_id = p_instructor_id
  )
  or exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.instructor_id = p_instructor_id
  );
$$;

create or replace function public.sync_event_primary_instructor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_primary uuid;
begin
  v_event_id := coalesce(new.event_id, old.event_id);

  select ei.instructor_id
  into v_primary
  from public.event_instructors ei
  where ei.event_id = v_event_id
  order by ei.sort_order, ei.created_at
  limit 1;

  update public.events
  set instructor_id = v_primary
  where id = v_event_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists event_instructors_sync_primary on public.event_instructors;

create trigger event_instructors_sync_primary
after insert or update or delete on public.event_instructors
for each row
execute function public.sync_event_primary_instructor();

create or replace function public.is_instructor_for_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.id = p_enrollment_id
      and public.event_has_instructor(e.event_id)
      and public.is_instructor()
  );
$$;

create or replace function public.is_instructor_for_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.event_has_instructor(p_event_id)
    and public.is_instructor();
$$;

alter table public.event_instructors enable row level security;

drop policy if exists event_instructors_select_assigned on public.event_instructors;
create policy event_instructors_select_assigned
  on public.event_instructors
  for select
  to authenticated
  using (
    public.is_admin()
    or instructor_id = auth.uid()
  );

drop policy if exists event_instructors_admin_all on public.event_instructors;
create policy event_instructors_admin_all
  on public.event_instructors
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "events_select_own_instructor" on public.events;
create policy "events_select_own_instructor"
  on public.events
  for select
  to authenticated
  using (public.event_has_instructor(id));

drop policy if exists "events_instructor_manage_own" on public.events;
create policy "events_instructor_manage_own"
  on public.events
  for all
  to authenticated
  using (
    public.is_instructor()
    and public.event_has_instructor(id)
  )
  with check (
    public.is_instructor()
    and public.event_has_instructor(id)
  );

drop policy if exists "enrollments_select_instructor" on public.enrollments;
create policy "enrollments_select_instructor"
  on public.enrollments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = enrollments.event_id
        and public.event_has_instructor(e.id)
    )
  );

drop policy if exists "enrollments_update_instructor" on public.enrollments;
create policy "enrollments_update_instructor"
  on public.enrollments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = enrollments.event_id
        and public.event_has_instructor(e.id)
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = enrollments.event_id
        and public.event_has_instructor(e.id)
    )
  );
