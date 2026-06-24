-- D2P Academy | Migration 008
-- Grades table for document evaluation and student reports.

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  score integer not null,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_score_range check (score >= 0 and score <= 100),
  constraint grades_student_document_unique unique (student_id, document_id)
);

create index if not exists grades_student_id_idx on public.grades (student_id);
create index if not exists grades_document_id_idx on public.grades (document_id);
create index if not exists grades_created_at_idx on public.grades (created_at desc);

drop trigger if exists grades_set_updated_at on public.grades;
create trigger grades_set_updated_at
before update on public.grades
for each row
execute function public.set_updated_at();

alter table public.grades enable row level security;

drop policy if exists "grades_select_own" on public.grades;
drop policy if exists "grades_admin_select" on public.grades;
drop policy if exists "grades_admin_insert" on public.grades;
drop policy if exists "grades_admin_update" on public.grades;
drop policy if exists "grades_admin_delete" on public.grades;

create policy "grades_select_own"
on public.grades
for select
to authenticated
using (student_id = auth.uid());

create policy "grades_admin_select"
on public.grades
for select
to authenticated
using (public.is_admin());

create policy "grades_admin_insert"
on public.grades
for insert
to authenticated
with check (public.is_admin());

create policy "grades_admin_update"
on public.grades
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "grades_admin_delete"
on public.grades
for delete
to authenticated
using (public.is_admin());
