-- Eski promote akışı role=instructor bırakmış olabilir; üye listesinde görünmeleri için onar.

update public.profiles
set is_instructor = true
where role = 'instructor'::public.user_role
  and is_instructor = false;

update public.profiles p
set role = 'parent'::public.user_role
where p.role = 'instructor'::public.user_role
  and p.is_instructor = true
  and exists (
    select 1
    from public.profiles c
    where c.parent_id = p.id
  );

update public.profiles p
set role = 'student'::public.user_role
where p.role = 'instructor'::public.user_role
  and p.is_instructor = true;
