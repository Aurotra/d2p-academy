-- D2P Academy | Migration 006
-- Ensure profile row exists for authenticated users (fixes missing profile on dashboard).

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
    coalesce(
      case
        when v_user.raw_user_meta_data ->> 'role' in ('student', 'instructor', 'admin')
          then (v_user.raw_user_meta_data ->> 'role')::public.user_role
        else 'student'::public.user_role
      end,
      'student'::public.user_role
    )
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = case
        when trim(public.profiles.full_name) = '' then excluded.full_name
        else public.profiles.full_name
      end
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());
