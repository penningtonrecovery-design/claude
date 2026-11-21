-- Phase 3: the illustrated grandfathers are replaced by AI-generated photo
-- portraits, one per background. Anyone who chose an illustration moves to
-- the photo closest to it in skin tone.

alter table public.profiles drop constraint profiles_avatar_id_check;

update public.profiles
set avatar_id = case avatar_id
  when 'warmsmile' then 'black'
  when 'flatcap' then 'latino'
  when 'cardigan' then 'white'
  when 'silverfox' then 'white'
  else avatar_id
end
where avatar_id in ('warmsmile', 'flatcap', 'cardigan', 'silverfox');

alter table public.profiles
  add constraint profiles_avatar_id_check
    check (avatar_id in ('black', 'east-asian', 'latino', 'south-asian', 'white'));
