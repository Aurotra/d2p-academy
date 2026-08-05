-- ADIM 4/4 — Boş etkinliklere ders çizelgesi oluştur

do $$
declare
  v_event_id uuid;
begin
  for v_event_id in
    select ev.id
    from public.events ev
    where not exists (
      select 1 from public.event_sessions es where es.event_id = ev.id
    )
  loop
    perform public.sync_event_sessions(v_event_id);
  end loop;
end;
$$;
