-- D2P Academy | Migration 030
-- Hybrid student auth: e-postasız çocuk hesapları (username/password)
-- + mevcut e-posta Auth hesapları çocuk ekleyebilir (parent_id = auth.uid()).
--
-- Mevcut e-posta öğrencileri (/dashboard) bozulmaz.
-- E-postasız çocuklar: profiles satırı auth.users olmadan; giriş JWT cookie ile.

-- ---------------------------------------------------------------------------
-- 1) ROLE ENUM: parent (opsiyonel; sahiplik parent_id ile)
-- ---------------------------------------------------------------------------
do $$
begin
  alter type public.user_role add value if not exists 'parent';
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2) profiles: auth.users FK kaldır + e-posta Auth dışı satırlara izin
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

-- E-postasız öğrenciler için email null olabilir
alter table public.profiles
  alter column email drop not null;

drop index if exists profiles_email_unique_idx;
create unique index if not exists profiles_email_unique_idx
  on public.profiles (email)
  where email is not null;

alter table public.profiles
  drop constraint if exists profiles_email_not_blank;

alter table public.profiles
  add constraint profiles_email_not_blank
  check (email is null or char_length(trim(email)) > 0);

alter table public.profiles
  drop constraint if exists profiles_email_lowercase;

alter table public.profiles
  add constraint profiles_email_lowercase
  check (email is null or email = lower(email));

-- ---------------------------------------------------------------------------
-- 3) Yeni kolonlar
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text,
  add column if not exists parent_id uuid references public.profiles (id) on delete cascade,
  add column if not exists student_password_hash text,
  add column if not exists student_session_version integer not null default 1;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

create index if not exists profiles_parent_id_idx
  on public.profiles (parent_id)
  where parent_id is not null;

-- Username-auth çocuk: username + parent_id + hash zorunlu.
-- E-posta Auth hesabı: username / parent_id / hash hep null.
alter table public.profiles
  drop constraint if exists profiles_student_fields_check;

alter table public.profiles
  add constraint profiles_student_fields_check
  check (
    (
      username is not null
      and parent_id is not null
      and student_password_hash is not null
      and role = 'student'::public.user_role
    )
    or (
      username is null
      and parent_id is null
      and student_password_hash is null
    )
  );

alter table public.profiles
  drop constraint if exists profiles_parent_id_only_for_username_student_check;

alter table public.profiles
  add constraint profiles_parent_id_only_for_username_student_check
  check (parent_id is null or role = 'student'::public.user_role);

comment on column public.profiles.username is
  'E-postasız öğrenci girişi (unique, lower). Auth.users kaydı yoktur.';
comment on column public.profiles.parent_id is
  'Çocuğu ekleyen e-posta Auth hesabının profiles.id (auth.uid()).';
comment on column public.profiles.student_password_hash is
  'bcrypt hash. ASLA client select edilmemeli.';
comment on column public.profiles.student_session_version is
  'Şifre sıfırlamada artırılır; JWT içindeki sv ile eşleşmezse oturum düşer.';

-- ---------------------------------------------------------------------------
-- 4) Hash kolonunu client rollerinden gizle
-- ---------------------------------------------------------------------------
revoke select (student_password_hash) on table public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Auth trigger: parent rolüne izin
-- ---------------------------------------------------------------------------
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
        when new.raw_user_meta_data ->> 'role' in ('student', 'instructor', 'admin', 'parent')
          then (new.raw_user_meta_data ->> 'role')::public.user_role
        else 'student'::public.user_role
      end,
      'student'::public.user_role
    )
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------------
create or replace function public.is_own_child(child_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = child_id
      and parent_id = auth.uid()
      and role = 'student'::public.user_role
      and username is not null
  );
$$;

-- ---------------------------------------------------------------------------
-- 7) RLS: herhangi bir e-posta Auth hesabı kendi çocuklarını yönetebilir
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_parent on public.profiles;
create policy profiles_select_parent
  on public.profiles
  for select
  to authenticated
  using (
    parent_id = auth.uid()
    and role = 'student'::public.user_role
    and username is not null
  );

drop policy if exists profiles_update_parent on public.profiles;
create policy profiles_update_parent
  on public.profiles
  for update
  to authenticated
  using (
    parent_id = auth.uid()
    and role = 'student'::public.user_role
    and username is not null
  )
  with check (
    parent_id = auth.uid()
    and role = 'student'::public.user_role
    and username is not null
  );

drop policy if exists profiles_insert_parent on public.profiles;
create policy profiles_insert_parent
  on public.profiles
  for insert
  to authenticated
  with check (
    parent_id = auth.uid()
    and role = 'student'::public.user_role
    and username is not null
  );

-- ---------------------------------------------------------------------------
-- 8) Badge / print iskelet tablolar (yoksa)
-- ---------------------------------------------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  icon_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default timezone('utc', now()),
  unique (student_id, badge_id)
);

create table if not exists public.print_work_orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  item_name text not null,
  status text not null default 'queued'
    check (status in ('queued', 'printing', 'ready', 'delivered', 'cancelled')),
  requested_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

alter table public.badges enable row level security;
alter table public.student_badges enable row level security;
alter table public.print_work_orders enable row level security;

drop policy if exists badges_select_authenticated on public.badges;
create policy badges_select_authenticated
  on public.badges for select to authenticated
  using (true);

drop policy if exists student_badges_select_own_or_parent on public.student_badges;
create policy student_badges_select_own_or_parent
  on public.student_badges for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_own_child(student_id)
    or public.is_admin()
  );

drop policy if exists print_work_orders_select_own_or_parent on public.print_work_orders;
create policy print_work_orders_select_own_or_parent
  on public.print_work_orders for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_own_child(student_id)
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 9) Progress RPC (gerçek şema: start_at, certificate status)
-- ---------------------------------------------------------------------------
create or replace function public.get_student_progress(p_student_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'enrollmentId', e.id,
        'eventTitle', ev.title,
        'eventDate', ev.start_at,
        'status', e.status,
        'certificateCode', e.student_code
      ) order by ev.start_at desc)
      from public.enrollments e
      join public.events ev on ev.id = e.event_id
      where e.user_id = p_student_id
    ), '[]'::jsonb),

    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'certificateCode', c.certificate_code,
        'issuedAt', c.issued_at,
        'programCode', ev.program_code,
        'verifyUrl', '/dogrula/' || c.certificate_code,
        'pdfUrl', c.pdf_url
      ) order by c.issued_at desc)
      from public.certificates c
      left join public.events ev on ev.id = c.event_id
      where c.user_id = p_student_id
        and c.status = 'active'::public.certificate_status
    ), '[]'::jsonb),

    'badges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', b.code,
        'name', b.name,
        'description', b.description,
        'iconUrl', b.icon_url,
        'awardedAt', sb.awarded_at
      ) order by sb.awarded_at desc)
      from public.student_badges sb
      join public.badges b on b.id = sb.badge_id
      where sb.student_id = p_student_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_student_progress(uuid) from public, anon, authenticated;
grant execute on function public.get_student_progress(uuid) to service_role;

create or replace function public.get_child_progress(p_child_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_own_child(p_child_id) and not public.is_admin() then
    raise exception 'Bu öğrenciye erişim yetkiniz yok' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'enrollmentId', e.id,
        'eventTitle', ev.title,
        'eventDate', ev.start_at,
        'status', e.status
      ) order by ev.start_at desc)
      from public.enrollments e
      join public.events ev on ev.id = e.event_id
      where e.user_id = p_child_id
    ), '[]'::jsonb),

    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'certificateCode', c.certificate_code,
        'issuedAt', c.issued_at,
        'pdfUrl', c.pdf_url
      ) order by c.issued_at desc)
      from public.certificates c
      where c.user_id = p_child_id
        and c.status = 'active'::public.certificate_status
    ), '[]'::jsonb),

    'badges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', b.name,
        'iconUrl', b.icon_url,
        'awardedAt', sb.awarded_at
      ) order by sb.awarded_at desc)
      from public.student_badges sb
      join public.badges b on b.id = sb.badge_id
      where sb.student_id = p_child_id
    ), '[]'::jsonb),

    'activePrintOrders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', po.id,
        'itemName', po.item_name,
        'status', po.status,
        'requestedAt', po.requested_at
      ) order by po.requested_at desc)
      from public.print_work_orders po
      where po.student_id = p_child_id
        and po.status in ('queued', 'printing', 'ready')
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.get_child_progress(uuid) from public, anon;
grant execute on function public.get_child_progress(uuid) to authenticated;
