-- D2P Academy | Migration 083
-- Production is missing is_event_participant_profile; reserve_event_enrollment calls it
-- at runtime (PL/pgSQL does not fail at CREATE if the helper is absent).

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

comment on function public.is_event_participant_profile(uuid) is
  'True when the profile is a student with a username (event participant, not parent self-enroll).';

revoke all on function public.is_event_participant_profile(uuid) from public;
grant execute on function public.is_event_participant_profile(uuid) to authenticated, service_role;
