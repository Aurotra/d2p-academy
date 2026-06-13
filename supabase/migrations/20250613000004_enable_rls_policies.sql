-- D2P Academy | Migration 004
-- Row Level Security policies.

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.enrollments enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_verification_logs enable row level security;
alter table public.certificate_code_sequences enable row level security;

-- schools
create policy "schools_select_active_public"
on public.schools
for select
to anon, authenticated
using (is_active = true);

create policy "schools_admin_all"
on public.schools
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- profiles
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "profiles_admin_insert"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "profiles_admin_delete"
on public.profiles
for delete
to authenticated
using (public.is_admin());

-- event_categories
create policy "event_categories_select_public"
on public.event_categories
for select
to anon, authenticated
using (true);

create policy "event_categories_admin_all"
on public.event_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- events
create policy "events_select_published_public"
on public.events
for select
to anon, authenticated
using (status = 'published'::public.event_status);

create policy "events_select_own_instructor"
on public.events
for select
to authenticated
using (instructor_id = auth.uid());

create policy "events_select_admin"
on public.events
for select
to authenticated
using (public.is_admin());

create policy "events_instructor_manage_own"
on public.events
for all
to authenticated
using (
  public.is_instructor()
  and instructor_id = auth.uid()
)
with check (
  public.is_instructor()
  and instructor_id = auth.uid()
);

create policy "events_admin_all"
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- enrollments
create policy "enrollments_select_own"
on public.enrollments
for select
to authenticated
using (user_id = auth.uid());

create policy "enrollments_select_instructor"
on public.enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = enrollments.event_id
      and e.instructor_id = auth.uid()
  )
);

create policy "enrollments_select_admin"
on public.enrollments
for select
to authenticated
using (public.is_admin());

create policy "enrollments_insert_own"
on public.enrollments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'published'::public.event_status
  )
);

create policy "enrollments_update_admin"
on public.enrollments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "enrollments_update_instructor"
on public.enrollments
for update
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = enrollments.event_id
      and e.instructor_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.events e
    where e.id = enrollments.event_id
      and e.instructor_id = auth.uid()
  )
);

create policy "enrollments_delete_admin"
on public.enrollments
for delete
to authenticated
using (public.is_admin());

-- certificates
create policy "certificates_select_own"
on public.certificates
for select
to authenticated
using (user_id = auth.uid());

create policy "certificates_select_admin"
on public.certificates
for select
to authenticated
using (public.is_admin());

create policy "certificates_admin_manage"
on public.certificates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- certificate_verification_logs
create policy "certificate_verification_logs_admin_select"
on public.certificate_verification_logs
for select
to authenticated
using (public.is_admin());

-- certificate_code_sequences (internal only)
create policy "certificate_code_sequences_admin_only"
on public.certificate_code_sequences
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
