-- Row-level security checks. Each block raises an exception on failure.
-- Run with scripts/test-rls.sh (plain Postgres) or against local Supabase.

-- Supabase grants these by default; the shim needs them explicitly.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.memories to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test');

-- The trigger created one profile per user.
do $$ begin
  if (select count(*) from public.profiles where id in
      ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')) <> 2 then
    raise exception 'FAIL: expected a profile per new user';
  end if;
end $$;

-- Memory consent defaults to off.
do $$ begin
  if exists (select 1 from public.profiles where memory_enabled and id in
      ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')) then
    raise exception 'FAIL: memory must default to off';
  end if;
end $$;

-- User A acts.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', false);

insert into public.memories (category, content) values ('goal', 'A private goal');

do $$ begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'FAIL: user A can see other profiles';
  end if;
  if (select count(*) from public.memories) <> 1 then
    raise exception 'FAIL: user A cannot see own memory';
  end if;
end $$;

-- A cannot write a memory for B.
do $$ begin
  begin
    insert into public.memories (user_id, category, content)
      values ('22222222-2222-2222-2222-222222222222', 'goal', 'forged');
    raise exception 'FAIL: user A inserted a memory for user B';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A cannot change B's profile (no rows visible, so zero rows updated).
update public.profiles set display_name = 'hijacked'
  where id = '22222222-2222-2222-2222-222222222222';

-- A cannot insert or delete profiles directly.
do $$ begin
  begin
    delete from public.profiles where id = '11111111-1111-1111-1111-111111111111';
    raise exception 'FAIL: user deleted a profile row directly';
  exception when insufficient_privilege then null;
  end;
end $$;

-- User B acts.
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', false);

do $$ begin
  if (select count(*) from public.memories) <> 0 then
    raise exception 'FAIL: user B can see user A''s memories';
  end if;
  if (select display_name from public.profiles) is not null then
    raise exception 'FAIL: user A modified user B''s profile';
  end if;
end $$;

delete from public.memories;  -- B's delete must not touch A's rows.

-- Anonymous visitors see nothing.
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
do $$ begin
  begin
    perform 1 from public.memories;
    raise exception 'FAIL: anon can read memories';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$ begin
  if (select count(*) from public.memories where user_id = '11111111-1111-1111-1111-111111111111') <> 1 then
    raise exception 'FAIL: user B deleted user A''s memory';
  end if;
end $$;

-- Deleting an auth user removes their data.
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  if exists (select 1 from public.memories where user_id = '11111111-1111-1111-1111-111111111111') or
     exists (select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111') then
    raise exception 'FAIL: account deletion left personal data behind';
  end if;
end $$;

select 'ALL RLS CHECKS PASSED' as result;
