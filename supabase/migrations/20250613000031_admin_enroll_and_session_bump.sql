-- D2P Academy | Migration 031
-- Admin can enroll any student; bump session_version when password hash changes;
-- authenticated cannot UPDATE hash column (must use service role).

create policy enrollments_insert_admin
  on public.enrollments
  for insert
  to authenticated
  with check (public.is_admin());

revoke update (student_password_hash) on table public.profiles from anon, authenticated;

create or replace function public.bump_student_session_on_password_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.student_password_hash is distinct from old.student_password_hash
     and new.student_password_hash is not null then
    new.student_session_version := coalesce(old.student_session_version, 1) + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists bump_student_session_on_password_change on public.profiles;
create trigger bump_student_session_on_password_change
before update on public.profiles
for each row
execute function public.bump_student_session_on_password_change();
