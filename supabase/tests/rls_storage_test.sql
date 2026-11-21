-- Row-level security checks for keepsake photos in storage.

grant select, insert, update, delete on storage.objects to authenticated;

insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'e@example.test'),
  ('66666666-6666-6666-6666-666666666666', 'f@example.test');

do $$ begin
  if not exists (select 1 from storage.buckets where id = 'keepsakes' and public = false) then
    raise exception 'FAIL: keepsakes bucket missing or public';
  end if;
  if (select companion_mode from public.profiles where id = '55555555-5555-5555-5555-555555555555') <> 'voice' then
    raise exception 'FAIL: companion mode must default to voice';
  end if;
end $$;

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555"}', false);

insert into storage.objects (bucket_id, name)
  values ('keepsakes', '55555555-5555-5555-5555-555555555555/keepsake.jpg');

-- E cannot write into F's folder, or outside any folder.
do $$ begin
  begin
    insert into storage.objects (bucket_id, name)
      values ('keepsakes', '66666666-6666-6666-6666-666666666666/planted.jpg');
    raise exception 'FAIL: E wrote into F''s folder';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('keepsakes', 'loose.jpg');
    raise exception 'FAIL: E wrote outside a user folder';
  exception when insufficient_privilege then null;
  end;
end $$;

-- F cannot see or delete E's photo.
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666"}', false);
do $$ begin
  if exists (select 1 from storage.objects) then raise exception 'FAIL: F sees E''s photo'; end if;
end $$;
delete from storage.objects;

-- Anonymous visitors see nothing.
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
do $$ begin
  begin
    perform 1 from storage.objects;
    raise exception 'FAIL: anon can read storage objects';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$ begin
  if (select count(*) from storage.objects where name like '55555555-%') <> 1 then
    raise exception 'FAIL: F deleted E''s photo';
  end if;
end $$;

select 'ALL STORAGE RLS CHECKS PASSED' as result;
