-- D2P Academy | Migration 059
-- Etkinlik kayıtları yalnızca kullanıcı adlı öğrenci profillerine açılır; veli self-enroll engellenir.

create or replace function public.is_event_participant_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.role = 'student'::public.user_role
      and nullif(trim(p.username), '') is not null
  );
$$;

drop policy if exists "enrollments_insert_own" on public.enrollments;

create policy "enrollments_insert_own"
on public.enrollments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_event_participant_profile(auth.uid())
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'published'::public.event_status
  )
);

-- Veli veya kullanıcı adı olmayan hatalı kayıtları iptal et
update public.enrollments e
set status = 'cancelled'::public.enrollment_status,
    updated_at = timezone('utc', now())
from public.profiles p
where e.user_id = p.id
  and e.status <> 'cancelled'::public.enrollment_status
  and not public.is_event_participant_profile(p.id);

-- Aynı etkinlikte çocuğu kayıtlıyken velinin kendi kaydını iptal et
update public.enrollments e_parent
set status = 'cancelled'::public.enrollment_status,
    updated_at = timezone('utc', now())
where e_parent.status <> 'cancelled'::public.enrollment_status
  and exists (
    select 1
    from public.profiles parent
    join public.profiles child
      on child.parent_id = parent.id
      and child.role = 'student'::public.user_role
      and nullif(trim(child.username), '') is not null
    join public.enrollments e_child
      on e_child.user_id = child.id
      and e_child.event_id = e_parent.event_id
      and e_child.status <> 'cancelled'::public.enrollment_status
    where e_parent.user_id = parent.id
  );
