-- D2P Academy | Migration 024
-- Fix health_notes writes under RLS (upsert/RETURNING needs SELECT or SECURITY DEFINER).
-- Keep SELECT staff-only; owners write via security definer RPC.

create or replace function public.upsert_own_health_note(
  p_enrollment_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select e.user_id
  into v_owner
  from public.enrollments e
  where e.id = p_enrollment_id;

  if not found then
    raise exception 'Kayıt bulunamadı.';
  end if;

  if v_owner <> auth.uid() and not public.is_admin() then
    raise exception 'Bu kayıt için işlem yapma yetkiniz yok.';
  end if;

  if nullif(trim(p_note), '') is null then
    delete from public.health_notes
    where enrollment_id = p_enrollment_id;
    return;
  end if;

  insert into public.health_notes (enrollment_id, note)
  values (p_enrollment_id, trim(p_note))
  on conflict (enrollment_id)
  do update
    set note = excluded.note,
        updated_at = timezone('utc', now());
end;
$$;

grant execute on function public.upsert_own_health_note(uuid, text) to authenticated;
