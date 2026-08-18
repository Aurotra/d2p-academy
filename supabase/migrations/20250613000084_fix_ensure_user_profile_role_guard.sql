-- D2P Academy | Migration 084
-- ensure_user_profile was converting leftover email-auth "student" rows to parent,
-- but guard_profiles_sensitive_columns blocked that UPDATE for the signed-in user.

-- Repair email-auth accounts that are not child profiles (runs without JWT, so the
-- sensitive-column trigger allows it).
update public.profiles as p
set role = 'parent'::public.user_role
where p.role = 'student'::public.user_role
  and p.parent_id is null
  and p.username is null
  and exists (
    select 1
    from auth.users as u
    where u.id = p.id
  );

create or replace function public.guard_profiles_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    -- Self-heal: email-auth users created before parent was the default.
    if not (
      new.id = auth.uid()
      and old.role = 'student'::public.user_role
      and new.role = 'parent'::public.user_role
      and old.parent_id is null
      and old.username is null
    ) then
      raise exception using errcode = '42501', message = 'profiles_role_update_forbidden';
    end if;
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

create or replace function public.ensure_user_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users;
  v_profile public.profiles;
begin
  select *
  into v_user
  from auth.users
  where id = auth.uid();

  if not found then
    raise exception 'Authenticated user not found.';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    v_user.id,
    coalesce(
      nullif(trim(v_user.raw_user_meta_data ->> 'full_name'), ''),
      split_part(v_user.email, '@', 1)
    ),
    lower(v_user.email),
    public.resolve_auth_user_profile_role(v_user.raw_user_meta_data)
  )
  on conflict (id) do update
    set
      full_name = case
        when trim(public.profiles.full_name) = '' then excluded.full_name
        else public.profiles.full_name
      end,
      role = case
        when public.profiles.role = 'student'::public.user_role
          and public.profiles.parent_id is null
          and public.profiles.username is null
          then 'parent'::public.user_role
        else public.profiles.role
      end
  returning * into v_profile;

  if v_profile is null then
    select *
    into v_profile
    from public.profiles
    where id = v_user.id;
  end if;

  return v_profile;
end;
$$;
