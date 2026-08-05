-- D2P Academy | Migration 064
-- Yoklama: total_lesson_count yoksa günlük ders saatlerinden otomatik hesapla;
-- her slot = 1 numaralı ders (1. Ders … N. Ders), saat etiketi UI’da gösterilmez.

create or replace function public.compute_event_total_lesson_count(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_daily_lesson_start time,
  p_daily_lesson_end time,
  p_lesson_duration_minutes integer
)
returns integer
language plpgsql
immutable
as $$
declare
  v_day date;
  v_last_day date;
  v_days integer := 0;
  v_daily_minutes integer;
  v_per_day integer;
begin
  if p_lesson_duration_minutes is null or p_lesson_duration_minutes <= 0 then
    return 0;
  end if;

  if p_daily_lesson_end <= p_daily_lesson_start then
    return 0;
  end if;

  v_daily_minutes :=
    (extract(hour from p_daily_lesson_end) * 60 + extract(minute from p_daily_lesson_end))
    - (extract(hour from p_daily_lesson_start) * 60 + extract(minute from p_daily_lesson_start));

  v_per_day := v_daily_minutes / p_lesson_duration_minutes;
  if v_per_day <= 0 then
    return 0;
  end if;

  v_day := (p_start_at at time zone 'Europe/Istanbul')::date;
  v_last_day := (p_end_at at time zone 'Europe/Istanbul')::date;
  v_days := (v_last_day - v_day) + 1;

  return v_per_day * greatest(v_days, 1);
end;
$$;

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
  select
    id,
    start_at,
    end_at,
    daily_lesson_start,
    daily_lesson_end,
    lesson_duration_minutes,
    total_lesson_count
  into v_event
  from public.events
  where id = p_event_id;

  if not found then
    return;
  end if;

  if v_event.daily_lesson_end <= v_event.daily_lesson_start then
    raise exception 'Günlük ders bitiş saati başlangıçtan sonra olmalıdır' using errcode = '22023';
  end if;

  v_target_count := coalesce(
    v_event.total_lesson_count,
    public.compute_event_total_lesson_count(
      v_event.start_at,
      v_event.end_at,
      v_event.daily_lesson_start,
      v_event.daily_lesson_end,
      v_event.lesson_duration_minutes
    )
  );

  if v_target_count is null or v_target_count <= 0 then
    raise exception 'Toplam ders sayısı hesaplanamadı; günlük saatleri veya toplam ders alanını kontrol edin'
      using errcode = '22023';
  end if;

  v_duration := make_interval(mins => v_event.lesson_duration_minutes);

  delete from public.event_sessions where event_id = p_event_id;

  v_day := (v_event.start_at at time zone 'Europe/Istanbul')::date;

  while v_day <= (v_event.end_at at time zone 'Europe/Istanbul')::date loop
    exit when v_index >= v_target_count;

    v_slot_start := (v_day + v_event.daily_lesson_start) at time zone 'Europe/Istanbul';
    v_day_end := (v_day + v_event.daily_lesson_end) at time zone 'Europe/Istanbul';

    while v_slot_start + v_duration <= v_day_end loop
      exit when v_index >= v_target_count;

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

-- Mevcut etkinlikler: total_lesson_count boşsa otomatik doldur ve oturumları yenile.
update public.events e
set total_lesson_count = public.compute_event_total_lesson_count(
  e.start_at,
  e.end_at,
  e.daily_lesson_start,
  e.daily_lesson_end,
  e.lesson_duration_minutes
)
where e.total_lesson_count is null;

-- Oturumları yeniden oluşturmak için etkinliği admin panelinden kaydedin.
-- (sync_event_sessions mevcut oturum id’lerini siler; yoklama verisi korunmaz.)
