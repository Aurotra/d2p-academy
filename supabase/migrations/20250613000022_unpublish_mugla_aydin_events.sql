-- Remove the current Muğla and Aydın training events from the public site
-- while preserving their enrollment and certificate history.

update public.events
set status = 'cancelled'::public.event_status
where status = 'published'::public.event_status
  and (
    (
      lower(trim(location_name)) = 'muğla'
      and title = 'İleri Seviye 3D Modelleme ve Prototipleme'
    )
    or
    (
      lower(trim(location_name)) = 'aydın'
      and title = '3D Yazıcı Teknolojileri ve Üretim Atölyesi'
    )
  );
