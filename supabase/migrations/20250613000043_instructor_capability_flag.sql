-- Eğitmen yetkisi artık role sütunundan bağımsız: veli/eğitmen veya admin/eğitmen birlikte olabilir.

alter table public.profiles
  add column if not exists is_instructor boolean not null default false;

comment on column public.profiles.is_instructor is
  'Eğitmen paneli ve atanmış etkinlik yoklaması yetkisi. role (parent/student/admin) ayrı kalır.';

create index if not exists profiles_is_instructor_idx
  on public.profiles (is_instructor)
  where is_instructor = true;

-- Mevcut role=instructor hesaplarını bayrağa taşı; veli/üye rolünü geri yükle.
update public.profiles p
set is_instructor = true
where p.role = 'instructor'::public.user_role;

update public.profiles p
set role = 'parent'::public.user_role
where p.role = 'instructor'::public.user_role
  and exists (
    select 1
    from public.profiles c
    where c.parent_id = p.id
  );

update public.profiles p
set role = 'student'::public.user_role
where p.role = 'instructor'::public.user_role
  and p.is_instructor = true;

create or replace function public.is_instructor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and (
        is_instructor = true
        or role = 'instructor'::public.user_role
      )
  );
$$;
