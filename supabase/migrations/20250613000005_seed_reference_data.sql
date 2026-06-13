-- D2P Academy | Migration 005
-- Optional reference seed data for development/staging.

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
