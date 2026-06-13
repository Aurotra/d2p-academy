-- D2P Academy: Kendinizi admin yapın (e-postanızı değiştirin)
update public.profiles
set role = 'admin'::public.user_role
where email = 'SIZIN-EPOSTA@adres.com';
