-- D2P Academy | Migration 061
-- Yoklama dersleri: total_lesson_count kadar 1..N oturum (062 ile ayrıldı);
-- saatlik etiket yerine ders numarası (session_index).
create or replace function public.sync_event_sessions(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_day date;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_day_end timestamptz;
  v_index integer := 0;
  v_duration interval;
  v_target_count integer;
begin
  select id, start_at, end_at, daily_lesson_start, daily_lesson_end, lesson_duration_minutes, required_lesson_count
  into v_event
  from public.events
  where id = p_event_id;

  if not found then
    return;
  end if;

  if v_event.daily_lesson_end <= v_event.daily_lesson_start then
    raise exception 'Günlük ders bitiş saati başlangıçtan sonra olmalıdır' using errcode = '22023';
  end if;

  v_target_count := v_event.required_lesson_count;
  v_duration := make_interval(mins => v_event.lesson_duration_minutes);

  delete from public.event_sessions where event_id = p_event_id;

  v_day := (v_event.start_at at time zone 'Europe/Istanbul')::date;

  while v_day <= (v_event.end_at at time zone 'Europe/Istanbul')::date loop
  exit when v_target_count is not null and v_index >= v_target_count;

    v_slot_start := (v_day + v_event.daily_lesson_start) at time zone 'Europe/Istanbul';
    v_day_end := (v_day + v_event.daily_lesson_end) at time zone 'Europe/Istanbul';

    while v_slot_start + v_duration <= v_day_end loop
      exit when v_target_count is not null and v_index >= v_target_count;

      v_index := v_index + 1;
      v_slot_end := v_slot_start + v_duration;

      insert into public.event_sessions (event_id, session_index, starts_at, ends_at)
      values (p_event_id, v_index, v_slot_start, v_slot_end);

      v_slot_start := v_slot_end;
    end loop;

    v_day := v_day + 1;
  end loop;
end;
$$;
