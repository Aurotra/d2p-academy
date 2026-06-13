-- D2P Academy | Migration 001
-- Extensions, enum types, and shared helper functions.

create extension if not exists "pgcrypto";

create type public.user_role as enum (
  'student',
  'instructor',
  'admin'
);

create type public.event_type as enum (
  'training',
  'maker_workshop',
  'bootcamp',
  'seminar'
);

create type public.event_status as enum (
  'draft',
  'published',
  'cancelled',
  'completed'
);

create type public.enrollment_status as enum (
  'registered',
  'attended',
  'completed',
  'cancelled',
  'no_show'
);

create type public.certificate_status as enum (
  'active',
  'revoked'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
