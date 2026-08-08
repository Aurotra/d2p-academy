-- D2P Academy | Migration 074
-- Block privilege escalation: non-admin users must not change role, instructor flag,
-- or other identity / auth columns on profiles (RLS alone allowed self-update of all columns).

create or replace function public.guard_profiles_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / direct SQL (no JWT subject) — app server mutations.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception using errcode = '42501', message = 'profiles_role_update_forbidden';
  end if;

  if new.is_instructor is distinct from old.is_instructor then
    raise exception using errcode = '42501', message = 'profiles_instructor_flag_update_forbidden';
  end if;

  if new.student_password_hash is distinct from old.student_password_hash then
    raise exception using errcode = '42501', message = 'profiles_student_password_update_forbidden';
  end if;

  if new.parent_id is distinct from old.parent_id then
    raise exception using errcode = '42501', message = 'profiles_parent_id_update_forbidden';
  end if;

  if new.username is distinct from old.username then
    raise exception using errcode = '42501', message = 'profiles_username_update_forbidden';
  end if;

  if new.student_session_version is distinct from old.student_session_version then
    raise exception using errcode = '42501', message = 'profiles_session_version_update_forbidden';
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception using errcode = '42501', message = 'profiles_is_active_update_forbidden';
  end if;

  if new.email is distinct from old.email then
    raise exception using errcode = '42501', message = 'profiles_email_update_forbidden';
  end if;

  return new;
end;
$$;

comment on function public.guard_profiles_sensitive_columns() is
  'Prevents authenticated non-admins from escalating privileges via profiles UPDATE.';

drop trigger if exists guard_profiles_sensitive_columns on public.profiles;

create trigger guard_profiles_sensitive_columns
before update on public.profiles
for each row
execute function public.guard_profiles_sensitive_columns();

-- Column-level revoke (defense in depth; service_role retains full UPDATE).
revoke update (role) on table public.profiles from anon, authenticated;
revoke update (is_instructor) on table public.profiles from anon, authenticated;
revoke update (parent_id) on table public.profiles from anon, authenticated;
revoke update (username) on table public.profiles from anon, authenticated;
revoke update (student_session_version) on table public.profiles from anon, authenticated;
revoke update (is_active) on table public.profiles from anon, authenticated;
revoke update (email) on table public.profiles from anon, authenticated;

-- student_password_hash revoke added in migration 031.
