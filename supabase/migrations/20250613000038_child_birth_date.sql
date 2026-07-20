-- D2P Academy | Migration 038
-- Doğum tarihi (username-auth çocuk hesapları).

alter table public.profiles
  add column if not exists birth_date date;

comment on column public.profiles.birth_date is
  'Kullanıcı adlı öğrenci hesapları için doğum tarihi; kullanıcı adı üretiminde kullanılır.';
