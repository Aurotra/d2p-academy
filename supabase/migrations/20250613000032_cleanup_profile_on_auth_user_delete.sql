-- D2P Academy | Migration 032
-- When an Auth user is deleted, remove the matching email-auth profile.
-- Username-only children (no auth.users row) are untouched by this trigger.
-- Children with parent_id cascade when the parent profile row is deleted.

create or replace function public.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles
  where id = old.id
    and username is null;

  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
after delete on auth.users
for each row
execute function public.handle_auth_user_deleted();

comment on function public.handle_auth_user_deleted() is
  'Cleans email-auth profiles after auth.users delete (FK was dropped in migration 030).';
