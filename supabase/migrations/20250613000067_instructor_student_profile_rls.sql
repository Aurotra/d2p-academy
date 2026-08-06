-- D2P Academy | Migration 067
-- Eğitmen yoklama listesinde tüm kayıtlı öğrenciler görünsün (yalnızca kendi çocukları değil).
-- 042 profiles_select_instructor_students yalnızca events.instructor_id kullanıyordu;
-- çoklu eğitmen (event_instructors) atamasında diğer öğrenci profilleri RLS ile gizleniyordu.

drop policy if exists profiles_select_instructor_students on public.profiles;

create policy profiles_select_instructor_students
  on public.profiles
  for select
  to authenticated
  using (
    public.is_admin()
    or id = auth.uid()
    or (
      public.is_instructor()
      and exists (
        select 1
        from public.enrollments e
        where e.user_id = profiles.id
          and public.event_has_instructor(e.event_id)
      )
    )
  );
