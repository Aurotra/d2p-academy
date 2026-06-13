-- D2P Academy | Migration 002
-- Core relational tables and foreign keys.

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text,
  district text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint schools_name_not_blank check (char_length(trim(name)) > 0),
  constraint schools_slug_not_blank check (char_length(trim(slug)) > 0)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'student',
  school_id uuid references public.schools (id) on delete set null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_full_name_not_blank check (char_length(trim(full_name)) > 0),
  constraint profiles_email_not_blank check (char_length(trim(email)) > 0),
  constraint profiles_email_lowercase check (email = lower(email))
);

create unique index profiles_email_unique_idx on public.profiles (email);
create index profiles_school_id_idx on public.profiles (school_id);
create index profiles_role_idx on public.profiles (role);

create or replace function public.is_admin()
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
      and role = 'admin'::public.user_role
      and is_active = true
  );
$$;

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
      and role = 'instructor'::public.user_role
      and is_active = true
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true;
$$;

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#0891b2',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint event_categories_name_not_blank check (char_length(trim(name)) > 0),
  constraint event_categories_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint event_categories_color_hex check (color ~* '^#[0-9a-f]{6}$')
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  event_type public.event_type not null,
  category_id uuid references public.event_categories (id) on delete set null,
  instructor_id uuid references public.profiles (id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location_name text,
  is_online boolean not null default false,
  meeting_url text,
  max_capacity integer,
  status public.event_status not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_title_not_blank check (char_length(trim(title)) > 0),
  constraint events_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint events_end_after_start check (end_at > start_at),
  constraint events_max_capacity_positive check (max_capacity is null or max_capacity > 0)
);

create index events_status_start_at_idx on public.events (status, start_at);
create index events_instructor_id_idx on public.events (instructor_id);
create index events_category_id_idx on public.events (category_id);
create index events_event_type_idx on public.events (event_type);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  status public.enrollment_status not null default 'registered',
  registered_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint enrollments_user_event_unique unique (user_id, event_id),
  constraint enrollments_completed_at_when_completed check (
    status <> 'completed'::public.enrollment_status
    or completed_at is not null
  )
);

create index enrollments_user_id_idx on public.enrollments (user_id);
create index enrollments_event_id_idx on public.enrollments (event_id);
create index enrollments_status_idx on public.enrollments (status);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_code text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete restrict,
  enrollment_id uuid not null unique references public.enrollments (id) on delete restrict,
  issued_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  status public.certificate_status not null default 'active',
  revoked_at timestamptz,
  revoke_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint certificates_code_not_blank check (char_length(trim(certificate_code)) > 0),
  constraint certificates_code_format check (certificate_code ~* '^D2P-[0-9]{4}-[0-9]{4,}$'),
  constraint certificates_revoked_fields check (
    status <> 'revoked'::public.certificate_status
    or revoked_at is not null
  )
);

create index certificates_user_id_idx on public.certificates (user_id);
create index certificates_event_id_idx on public.certificates (event_id);
create index certificates_status_idx on public.certificates (status);

create table public.certificate_verification_logs (
  id uuid primary key default gen_random_uuid(),
  certificate_code text not null,
  certificate_id uuid references public.certificates (id) on delete set null,
  is_valid boolean not null,
  ip_hash text,
  user_agent text,
  verified_at timestamptz not null default timezone('utc', now())
);

create index certificate_verification_logs_code_idx
  on public.certificate_verification_logs (certificate_code);

create index certificate_verification_logs_verified_at_idx
  on public.certificate_verification_logs (verified_at desc);

-- updated_at triggers
create trigger set_schools_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_event_categories_updated_at
before update on public.event_categories
for each row
execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create trigger set_enrollments_updated_at
before update on public.enrollments
for each row
execute function public.set_updated_at();

create trigger set_certificates_updated_at
before update on public.certificates
for each row
execute function public.set_updated_at();
