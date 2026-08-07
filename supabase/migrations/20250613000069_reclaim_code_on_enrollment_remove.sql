-- D2P Academy | Migration 069
-- Kurstan çıkarma / kayıt silme: sertifika numarasını (student_code) serbest bırak

-- İptal durumunda da numarayı geri al (eski: sadece null yapılıyordu)
create or replace function public.clear_enrollment_student_code_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled'::public.enrollment_status
     and old.status is distinct from 'cancelled'::public.enrollment_status then
    if nullif(trim(old.student_code), '') is not null then
      perform public.reclaim_certificate_sequence(old.student_code);
    end if;
    new.student_code := null;
  end if;
  return new;
end;
$$;

-- Kayıt silinirken atanmış kurs/sertifika numarasını geri al
create or replace function public.reclaim_enrollment_student_code_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(old.student_code), '') is not null then
    perform public.reclaim_certificate_sequence(old.student_code);
  end if;
  return old;
end;
$$;

drop trigger if exists reclaim_enrollment_student_code_before_delete on public.enrollments;
create trigger reclaim_enrollment_student_code_before_delete
before delete on public.enrollments
for each row
execute function public.reclaim_enrollment_student_code_before_delete();

-- Sertifika satırı silinirken numarayı geri al (kurstan çıkarma / iptal)
create or replace function public.reclaim_certificate_code_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(old.certificate_code), '') is not null then
    perform public.reclaim_certificate_sequence(old.certificate_code);
  end if;
  return old;
end;
$$;

drop trigger if exists reclaim_certificate_code_before_delete on public.certificates;
create trigger reclaim_certificate_code_before_delete
before delete on public.certificates
for each row
execute function public.reclaim_certificate_code_before_delete();
