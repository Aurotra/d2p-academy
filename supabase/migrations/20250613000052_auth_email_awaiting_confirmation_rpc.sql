-- Login sırasında onay bekleyen e-postayı tespit etmek için (service role)

create or replace function public.is_auth_email_awaiting_confirmation(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where lower(u.email) = lower(trim(p_email))
      and u.email_confirmed_at is null
      and u.deleted_at is null
  );
$$;

revoke all on function public.is_auth_email_awaiting_confirmation(text) from public;
grant execute on function public.is_auth_email_awaiting_confirmation(text) to service_role;
