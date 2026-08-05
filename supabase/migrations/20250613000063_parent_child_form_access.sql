-- D2P Academy | Migration 063
-- Veli, çocuğunun etkinlik kaydı ve katılımcı formlarına erişebilsin
-- (service_role yoksa veya authenticated client ile form doldururken).

drop policy if exists enrollments_select_parent on public.enrollments;
create policy enrollments_select_parent
  on public.enrollments
  for select
  to authenticated
  using (public.is_own_child(user_id));

-- consent_records
drop policy if exists consent_records_select_own on public.consent_records;
create policy consent_records_select_own
  on public.consent_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists consent_records_insert_own on public.consent_records;
create policy consent_records_insert_own
  on public.consent_records
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists consent_records_update_own on public.consent_records;
create policy consent_records_update_own
  on public.consent_records
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  )
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

-- intake_responses
drop policy if exists intake_responses_select_own on public.intake_responses;
create policy intake_responses_select_own
  on public.intake_responses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists intake_responses_insert_own on public.intake_responses;
create policy intake_responses_insert_own
  on public.intake_responses
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists intake_responses_update_own on public.intake_responses;
create policy intake_responses_update_own
  on public.intake_responses
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  )
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

-- survey_responses
drop policy if exists survey_responses_select_own on public.survey_responses;
create policy survey_responses_select_own
  on public.survey_responses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists survey_responses_insert_own on public.survey_responses;
create policy survey_responses_insert_own
  on public.survey_responses
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists survey_responses_update_own on public.survey_responses;
create policy survey_responses_update_own
  on public.survey_responses
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  )
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

-- post_test_extra
drop policy if exists post_test_extra_select_own on public.post_test_extra;
create policy post_test_extra_select_own
  on public.post_test_extra
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists post_test_extra_insert_own on public.post_test_extra;
create policy post_test_extra_insert_own
  on public.post_test_extra
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

drop policy if exists post_test_extra_update_own on public.post_test_extra;
create policy post_test_extra_update_own
  on public.post_test_extra
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  )
  with check (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );

-- health_notes (select only; writes use upsert_own_health_note RPC)
drop policy if exists health_notes_select_own on public.health_notes;
create policy health_notes_select_own
  on public.health_notes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.id = enrollment_id
        and (e.user_id = auth.uid() or public.is_own_child(e.user_id))
    )
  );
