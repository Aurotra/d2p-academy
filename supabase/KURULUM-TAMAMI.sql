-- ============================================================
-- D2P ACADEMY - TUM VERITABANI KURULUMU (BOS PROJE ICIN)
-- Supabase Dashboard > SQL Editor > yapistir > Run
-- ============================================================

-- ---------- BOLUM 1: ENUM ve yardimci fonksiyonlar ----------
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

-- ---------- BOLUM 2: Tablolar ----------
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

-- ---------- BOLUM 3: Auth trigger ve sertifika fonksiyonlari ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(
      case
        when new.raw_user_meta_data ->> 'role' in ('student', 'instructor', 'admin')
          then (new.raw_user_meta_data ->> 'role')::public.user_role
        else 'student'::public.user_role
      end,
      'student'::public.user_role
    )
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table public.certificate_code_sequences (
  issue_year integer primary key,
  last_value bigint not null default 0,
  constraint certificate_code_sequences_year_valid check (issue_year >= 2000)
);

create or replace function public.generate_certificate_code(p_issued_at timestamptz default timezone('utc', now()))
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from p_issued_at)::integer;
  v_sequence bigint;
begin
  insert into public.certificate_code_sequences (issue_year, last_value)
  values (v_year, 1)
  on conflict (issue_year)
  do update
    set last_value = public.certificate_code_sequences.last_value + 1
  returning last_value into v_sequence;

  return format('D2P-%s-%s', v_year, lpad(v_sequence::text, 4, '0'));
end;
$$;

create or replace function public.issue_certificate(p_enrollment_id uuid)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment public.enrollments;
  v_certificate public.certificates;
  v_code text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can issue certificates.';
  end if;

  select *
  into v_enrollment
  from public.enrollments
  where id = p_enrollment_id;

  if not found then
    raise exception 'Enrollment not found.';
  end if;

  if v_enrollment.status <> 'completed'::public.enrollment_status then
    raise exception 'Enrollment must be completed before issuing a certificate.';
  end if;

  if exists (
    select 1
    from public.certificates
    where enrollment_id = p_enrollment_id
  ) then
    raise exception 'Certificate already exists for this enrollment.';
  end if;

  v_code := public.generate_certificate_code(timezone('utc', now()));

  insert into public.certificates (
    certificate_code,
    user_id,
    event_id,
    enrollment_id
  )
  values (
    v_code,
    v_enrollment.user_id,
    v_enrollment.event_id,
    v_enrollment.id
  )
  returning * into v_certificate;

  return v_certificate;
end;
$$;

create or replace function public.mask_full_name(p_full_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_parts text[];
  v_first text;
  v_last text;
begin
  v_parts := regexp_split_to_array(trim(p_full_name), '\s+');

  if array_length(v_parts, 1) is null then
    return '***';
  end if;

  v_first := v_parts[1];
  v_last := v_parts[array_length(v_parts, 1)];

  if array_length(v_parts, 1) = 1 then
    return left(v_first, 1) || repeat('*', greatest(char_length(v_first) - 1, 2));
  end if;

  return v_first || ' ' || left(v_last, 1) || repeat('*', greatest(char_length(v_last) - 1, 2));
end;
$$;

create or replace function public.verify_certificate(
  p_certificate_code text,
  p_ip_hash text default null,
  p_user_agent text default null
)
returns table (
  is_valid boolean,
  certificate_code text,
  holder_name text,
  event_title text,
  issued_at timestamptz,
  status public.certificate_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_certificate public.certificates;
  v_is_valid boolean := false;
  v_holder_name text;
  v_event_title text;
  v_normalized_code text := upper(trim(p_certificate_code));
begin
  select *
  into v_certificate
  from public.certificates
  where certificate_code = v_normalized_code;

  if found and v_certificate.status = 'active'::public.certificate_status then
    v_is_valid := true;

    select
      public.mask_full_name(p.full_name),
      e.title
    into v_holder_name, v_event_title
    from public.profiles p
    inner join public.events e on e.id = v_certificate.event_id
    where p.id = v_certificate.user_id;
  end if;

  insert into public.certificate_verification_logs (
    certificate_code,
    certificate_id,
    is_valid,
    ip_hash,
    user_agent
  )
  values (
    v_normalized_code,
    v_certificate.id,
    v_is_valid,
    p_ip_hash,
    p_user_agent
  );

  return query
  select
    v_is_valid,
    coalesce(v_certificate.certificate_code, v_normalized_code),
    v_holder_name,
    v_event_title,
    case when v_is_valid then v_certificate.issued_at else null::timestamptz end,
    case when v_is_valid then v_certificate.status else null::public.certificate_status end;
end;
$$;

grant execute on function public.verify_certificate(text, text, text) to anon, authenticated;
grant execute on function public.issue_certificate(uuid) to authenticated;

-- ---------- BOLUM 4: RLS guvenlik politikaları ----------
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.enrollments enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_verification_logs enable row level security;
alter table public.certificate_code_sequences enable row level security;

create policy "schools_select_active_public"
on public.schools for select to anon, authenticated using (is_active = true);

create policy "schools_admin_all"
on public.schools for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "profiles_admin_insert"
on public.profiles for insert to authenticated
with check (public.is_admin());

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "profiles_admin_delete"
on public.profiles for delete to authenticated
using (public.is_admin());

create policy "event_categories_select_public"
on public.event_categories for select to anon, authenticated using (true);

create policy "event_categories_admin_all"
on public.event_categories for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "events_select_published_public"
on public.events for select to anon, authenticated
using (status = 'published'::public.event_status);

create policy "events_select_own_instructor"
on public.events for select to authenticated using (instructor_id = auth.uid());

create policy "events_select_admin"
on public.events for select to authenticated using (public.is_admin());

create policy "events_instructor_manage_own"
on public.events for all to authenticated
using (public.is_instructor() and instructor_id = auth.uid())
with check (public.is_instructor() and instructor_id = auth.uid());

create policy "events_admin_all"
on public.events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "enrollments_select_own"
on public.enrollments for select to authenticated using (user_id = auth.uid());

create policy "enrollments_select_instructor"
on public.enrollments for select to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = enrollments.event_id and e.instructor_id = auth.uid()
  )
);

create policy "enrollments_select_admin"
on public.enrollments for select to authenticated using (public.is_admin());

create policy "enrollments_insert_own"
on public.enrollments for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published'::public.event_status
  )
);

create policy "enrollments_update_admin"
on public.enrollments for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "enrollments_update_instructor"
on public.enrollments for update to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = enrollments.event_id and e.instructor_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e
    where e.id = enrollments.event_id and e.instructor_id = auth.uid()
  )
);

create policy "enrollments_delete_admin"
on public.enrollments for delete to authenticated using (public.is_admin());

create policy "certificates_select_own"
on public.certificates for select to authenticated using (user_id = auth.uid());

create policy "certificates_select_admin"
on public.certificates for select to authenticated using (public.is_admin());

create policy "certificates_admin_manage"
on public.certificates for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "certificate_verification_logs_admin_select"
on public.certificate_verification_logs for select to authenticated
using (public.is_admin());

create policy "certificate_code_sequences_admin_only"
on public.certificate_code_sequences for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ---------- BOLUM 5: Ornek veriler ----------
insert into public.event_categories (name, slug, color, sort_order)
values
  ('Robotik', 'robotik', '#1e3a8a', 1),
  ('Maker Atolyesi', 'maker-atolyesi', '#0891b2', 2),
  ('Yazilim', 'yazilim', '#06b6d4', 3),
  ('STEM', 'stem', '#0ea5e9', 4)
on conflict (slug) do nothing;

insert into public.schools (name, slug, city, district, contact_email, is_active)
values
  ('D2P Demo Okulu', 'd2p-demo-okulu', 'Istanbul', 'Kadikoy', 'demo@d2pacademy.com', true)
on conflict (slug) do nothing;

-- ---------- BOLUM 6: Profil olusturma fonksiyonu ----------
create or replace function public.ensure_user_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users;
  v_profile public.profiles;
begin
  select * into v_user from auth.users where id = auth.uid();

  if not found then
    raise exception 'Authenticated user not found.';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    v_user.id,
    coalesce(
      nullif(trim(v_user.raw_user_meta_data ->> 'full_name'), ''),
      split_part(v_user.email, '@', 1)
    ),
    lower(v_user.email),
    'student'::public.user_role
  )
  on conflict (id) do update
    set email = excluded.email
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;

-- ---------- BOLUM 7: Mevcut kullanicilar icin profil olustur ----------
insert into public.profiles (id, full_name, email, role)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
  lower(u.email),
  'student'::public.user_role
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- TAMAMLANDI
