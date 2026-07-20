-- D2P Academy | Migration 037
-- Allow parents (is_own_child) to pass assert_enrollment_actor for child enrollments.

create or replace function public.assert_enrollment_actor(
  p_enrollment_user_id uuid,
  p_actor_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_auth uuid := auth.uid();
begin
  if public.is_admin() then
    return;
  end if;

  -- service_role / no auth.uid(): require explicit actor matching enrollment owner
  if v_auth is null then
    if p_actor_id is null or p_actor_id <> p_enrollment_user_id then
      raise exception 'Bu kayıt için işlem yapma yetkiniz yok.' using errcode = '42501';
    end if;
    return;
  end if;

  -- Email Auth: own enrollment
  if v_auth = p_enrollment_user_id then
    return;
  end if;

  -- Parent of username child
  if public.is_own_child(p_enrollment_user_id) then
    return;
  end if;

  raise exception 'Bu kayıt için işlem yapma yetkiniz yok.' using errcode = '42501';
end;
$$;

grant execute on function public.assert_enrollment_actor(uuid, uuid) to authenticated, service_role;
