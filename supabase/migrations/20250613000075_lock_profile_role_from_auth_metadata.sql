-- D2P Academy | Migration 075
-- Stop trusting privileged roles from auth.users metadata (admin/instructor/student self-signup).
-- Email-auth accounts are parents; instructors are provisioned via service role upsert.

create or replace function public.resolve_auth_user_profile_role(p_metadata jsonb)
returns public.user_role
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(p_metadata ->> 'role', '') = 'parent'
      then 'parent'::public.user_role
    else 'parent'::public.user_role
  end;
$$;

comment on function public.resolve_auth_user_profile_role(jsonb) is
  'Maps auth signup metadata to profiles.role. Ignores admin/instructor/student claims from clients.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    public.resolve_auth_user_profile_role(new.raw_user_meta_data)
  );

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
  v_role public.user_role;
begin
  select *
  into v_user
  from auth.users
  where id = auth.uid();

  if not found then
    raise exception 'Authenticated user not found.';
  end if;

  v_role := public.resolve_auth_user_profile_role(v_user.raw_user_meta_data);

  insert into public.profiles (id, full_name, email, role)
  values (
    v_user.id,
    coalesce(
      nullif(trim(v_user.raw_user_meta_data ->> 'full_name'), ''),
      split_part(v_user.email, '@', 1)
    ),
    lower(v_user.email),
    v_role
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = case
        when trim(public.profiles.full_name) = '' then excluded.full_name
        else public.profiles.full_name
      end,
      role = case
        when public.profiles.role = 'student'::public.user_role
          and excluded.role = 'parent'::public.user_role
          then excluded.role
        else public.profiles.role
      end
  returning * into v_profile;

  return v_profile;
end;
$$;

-- Authenticated self-insert: only parent row for own auth.users id (not admin/instructor).
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and role = 'parent'::public.user_role
    and parent_id is null
    and username is null
  );

create or replace function public.guard_profiles_sensitive_insert()
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

  if new.role = 'student'::public.user_role
     and new.parent_id = auth.uid()
     and new.username is not null then
    return new;
  end if;

  if new.id = auth.uid()
     and new.role = 'parent'::public.user_role
     and new.parent_id is null
     and new.username is null then
    return new;
  end if;

  raise exception using errcode = '42501', message = 'profiles_insert_forbidden';
end;
$$;

comment on function public.guard_profiles_sensitive_insert() is
  'Blocks authenticated clients from inserting privileged profile rows (admin/instructor/etc.).';

drop trigger if exists guard_profiles_sensitive_insert on public.profiles;

create trigger guard_profiles_sensitive_insert
before insert on public.profiles
for each row
execute function public.guard_profiles_sensitive_insert();
