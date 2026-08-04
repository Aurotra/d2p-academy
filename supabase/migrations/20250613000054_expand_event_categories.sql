-- D2P Academy | Migration 054
-- Richer event categories aligned with D2P education model + grouped picker metadata.

alter table public.event_categories
  add column if not exists description text,
  add column if not exists group_name text not null default 'Genel';

comment on column public.event_categories.description is
  'Admin etkinlik formu ve içerik filtreleri için kısa açıklama.';
comment on column public.event_categories.group_name is
  'Admin kategori seçicide gruplama başlığı.';

-- Mevcut kayıtları güncelle
update public.event_categories
set
  name = 'Robotik',
  group_name = 'Teknoloji & Kodlama',
  description = 'LEGO, sensör ve motorlarla robot tasarlama ve programlama.',
  color = '#1e3a8a',
  sort_order = 10
where slug = 'robotik';

update public.event_categories
set
  name = 'Maker Atölyesi',
  group_name = 'Üretim & 3D',
  description = 'El aletleri, montaj ve üretim odaklı genel maker çalışması.',
  color = '#0891b2',
  sort_order = 40
where slug = 'maker-atolyesi';

update public.event_categories
set
  name = 'Yazılım',
  group_name = 'Teknoloji & Kodlama',
  description = 'Uygulama, oyun ve dijital proje geliştirme atölyeleri.',
  color = '#06b6d4',
  sort_order = 12
where slug = 'yazilim';

update public.event_categories
set
  name = 'STEM',
  group_name = 'STEM & Keşif',
  description = 'Bilim, teknoloji, mühendislik ve matematik keşif etkinlikleri.',
  color = '#0ea5e9',
  sort_order = 20
where slug = 'stem';

update public.event_categories
set
  name = '3D Kalem',
  group_name = 'Üretim & 3D',
  description = '3D kalem ile hacim, form ve el-göz koordinasyonu çalışmaları.',
  color = '#7c3aed',
  sort_order = 3
where slug = '3d-kalem';

update public.event_categories
set
  name = '3D Yazıcı',
  group_name = 'Üretim & 3D',
  description = 'Katmanlı üretim, baskı ayarları ve fiziksel model çıktısı.',
  color = '#f59e0b',
  sort_order = 2
where slug = '3d-yazici';

update public.event_categories
set
  name = 'Drama & İletişim',
  group_name = 'Sanat & İletişim',
  description = 'Sahne, ifade, takım çalışması ve özgüven geliştirme.',
  color = '#ec4899',
  sort_order = 50
where slug = 'drama';

insert into public.event_categories (name, slug, color, sort_order, group_name, description)
values
  (
    '3D Tasarım',
    '3d-tasarim',
    '#2563eb',
    1,
    'Üretim & 3D',
    'CAD, dijital modelleme ve ürün tasarımı temelleri.'
  ),
  (
    'Prototipleme',
    'prototipleme',
    '#0284c7',
    4,
    'Üretim & 3D',
    'Fikirden çalışan modele: taslak, test ve iterasyon süreci.'
  ),
  (
    'Kodlama & Algoritma',
    'kodlama-algoritma',
    '#14b8a6',
    11,
    'Teknoloji & Kodlama',
    'Blok ve metin tabanlı kodlama, mantık ve problem çözme.'
  ),
  (
    'Elektronik & Arduino',
    'elektronik-arduino',
    '#6366f1',
    13,
    'Teknoloji & Kodlama',
    'Devre, sensör ve mikrodenetleyici ile akıllı projeler.'
  ),
  (
    'Design Thinking',
    'design-thinking',
    '#38bdf8',
    21,
    'STEM & Keşif',
    'Empati, fikir üretimi ve kullanıcı odaklı çözüm tasarımı.'
  ),
  (
    'Bilim & Deney',
    'bilim-deney',
    '#22c55e',
    22,
    'STEM & Keşif',
    'Gözlem, hipotez ve uygulamalı bilim deneyleri.'
  ),
  (
    'Discovery Camp',
    'discovery-camp',
    '#f97316',
    30,
    'Kamp & Program',
    'Keşif odaklı yoğun kamp programı ve atölye serisi.'
  ),
  (
    'Yaz / Kış Kampı',
    'yaz-kis-kampi',
    '#ea580c',
    31,
    'Kamp & Program',
    'Dönemsel yoğun kamp ve tatil dönemi programları.'
  ),
  (
    'Yoğun Bootcamp',
    'yogun-bootcamp',
    '#dc2626',
    32,
    'Kamp & Program',
    'Kısa sürede derinlemesine beceri kazandıran yoğun program.'
  ),
  (
    'Okul Sonrası Atölye',
    'okul-sonrasi-atolye',
    '#8b5cf6',
    41,
    'Kurumsal & Özel',
    'Haftalık düzenli okul sonrası atölye ve kulüp çalışmaları.'
  ),
  (
    'Kurumsal Eğitim',
    'kurumsal-egitim',
    '#475569',
    42,
    'Kurumsal & Özel',
    'Okul, belediye ve kurumlar için anahtar teslim eğitim paketi.'
  ),
  (
    'Açık Atölye & Tanıtım',
    'acik-atolye-tanitim',
    '#64748b',
    43,
    'Kurumsal & Özel',
    'Deneme dersi, aile günü ve tanıtım etkinlikleri.'
  ),
  (
    'Girişimcilik & Sunum',
    'girisimcilik-sunum',
    '#a855f7',
    51,
    'Sanat & İletişim',
    'Proje sunumu, pitch ve girişimcilik becerileri.'
  )
on conflict (slug) do update
set
  name = excluded.name,
  color = excluded.color,
  sort_order = excluded.sort_order,
  group_name = excluded.group_name,
  description = excluded.description;
