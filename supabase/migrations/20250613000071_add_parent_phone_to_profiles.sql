-- D2P Academy | Migration 071
-- Veli iletişim telefonu (çocuk profili üzerinden).

alter table public.profiles
  add column if not exists parent_phone text;

comment on column public.profiles.parent_phone is
  'Veli iletişim telefonu; veli tarafından doldurulan çocuk profilinde zorunlu.';

create or replace function public.is_profile_complete_for_certificate(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_coding text;
  v_hedef text;
  v_beklenti numeric;
  v_interests_ok boolean;
  v_parent_phone_ok boolean;
begin
  select *
  into v_profile
  from public.profiles
  where id = p_user_id;

  if not found then
    return false;
  end if;

  v_coding := nullif(trim(coalesce(v_profile.experience_data ->> 'coding_experience', '')), '');
  v_hedef := nullif(trim(coalesce(v_profile.motivation_data ->> 'hedef', '')), '');
  begin
    v_beklenti := nullif(v_profile.motivation_data ->> 'beklenti', '')::numeric;
  exception
    when others then
      v_beklenti := null;
  end;

  v_interests_ok := coalesce(cardinality(v_profile.interests), 0) > 0;

  v_parent_phone_ok :=
    v_profile.parent_id is null
    or (
      char_length(trim(coalesce(v_profile.parent_phone, ''))) > 0
      and trim(v_profile.parent_phone) ~ '^05\d{9}$'
    );

  return
    char_length(trim(coalesce(v_profile.full_name, ''))) > 0
    and char_length(trim(coalesce(v_profile.gender, ''))) > 0
    and char_length(trim(coalesce(v_profile.grade_level, ''))) > 0
    and char_length(trim(coalesce(v_profile.school_name, ''))) > 0
    and char_length(trim(coalesce(v_profile.city_district, ''))) > 0
    and v_coding is not null
    and v_interests_ok
    and v_hedef is not null
    and v_beklenti is not null
    and v_beklenti >= 1
    and v_beklenti <= 5
    and char_length(trim(coalesce(v_profile.profile_avatar_url, ''))) > 0
    and v_parent_phone_ok;
end;
$$;
