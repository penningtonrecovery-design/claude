-- Phase 3: how Fatherly Friend appears, and the private keepsake photo.

alter table public.profiles
  add column companion_mode text not null default 'voice'
    check (companion_mode in ('voice', 'avatar', 'photo')),
  add column avatar_id text
    check (avatar_id in ('cardigan', 'flatcap', 'silverfox', 'warmsmile')),
  add column keepsake_path text check (char_length(keepsake_path) <= 200),
  add column keepsake_caption text check (char_length(keepsake_caption) <= 40),
  add column keepsake_rights_confirmed_at timestamptz;

comment on column public.profiles.keepsake_caption is 'Optional caption for the keepsake photo. Never sent to the language model or voice provider.';

-- Private bucket. The app re-encodes uploads to JPEG before storing them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('keepsakes', 'keepsakes', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

-- Each user can only touch files inside a folder named after their own id.
create policy "keepsakes: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'keepsakes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "keepsakes: insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'keepsakes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "keepsakes: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'keepsakes' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'keepsakes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "keepsakes: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'keepsakes' and (storage.foldername(name))[1] = (select auth.uid())::text);
