-- Yeni etkinlik kategorileri: 3D Kalem, 3D Yazıcı, Drama

insert into public.event_categories (name, slug, color, sort_order)
values
  ('3D Kalem', '3d-kalem', '#7c3aed', 5),
  ('3D Yazıcı', '3d-yazici', '#f59e0b', 6),
  ('Drama', 'drama', '#ec4899', 7)
on conflict (slug) do nothing;
