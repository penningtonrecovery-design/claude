-- Row-level security checks for growth plans, steps and reflections.

grant select, insert, update, delete on public.growth_plans, public.plan_steps to authenticated;
grant select, insert, delete on public.reflections to authenticated;

insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'c@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'd@example.test');

-- User C creates a plan with a step, and a reflection.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', false);

insert into public.growth_plans (id, topic, focus)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'boundaries', 'saying no at work');
insert into public.plan_steps (plan_id, content, source)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'Notice one yes that meant no', 'library');
insert into public.reflections (confidence, proud_of) values (3, 'Called my brother');

-- User D tries to reach C's data.
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444"}', false);

do $$ begin
  if exists (select 1 from public.growth_plans) then raise exception 'FAIL: D sees C''s plan'; end if;
  if exists (select 1 from public.plan_steps) then raise exception 'FAIL: D sees C''s steps'; end if;
  if exists (select 1 from public.reflections) then raise exception 'FAIL: D sees C''s reflection'; end if;
end $$;

-- D cannot attach a step to C's plan, even claiming it as D's own step.
do $$ begin
  begin
    insert into public.plan_steps (plan_id, content)
      values ('aaaaaaaa-0000-0000-0000-000000000001', 'injected');
    raise exception 'FAIL: D added a step to C''s plan';
  exception when insufficient_privilege then null;
  end;
end $$;

-- D cannot move their own step onto C's plan.
insert into public.growth_plans (id, topic) values ('bbbbbbbb-0000-0000-0000-000000000002', 'career');
insert into public.plan_steps (id, plan_id, content)
  values ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'mine');
do $$ begin
  begin
    update public.plan_steps set plan_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      where id = 'cccccccc-0000-0000-0000-000000000003';
    raise exception 'FAIL: D moved a step onto C''s plan';
  exception when insufficient_privilege then null;
  end;
end $$;

-- D's updates and deletes can't touch C's rows.
update public.growth_plans set status = 'archived';
delete from public.reflections;

-- Ratings outside 1-5 are rejected.
do $$ begin
  begin
    insert into public.reflections (confidence) values (6);
    raise exception 'FAIL: rating 6 accepted';
  exception when check_violation then null;
  end;
end $$;

-- Reflections cannot be edited after the fact (no update grant or policy).
reset role;
do $$ begin
  if (select status from public.growth_plans where id = 'aaaaaaaa-0000-0000-0000-000000000001') <> 'active' then
    raise exception 'FAIL: D changed C''s plan';
  end if;
  if (select count(*) from public.reflections where user_id = '33333333-3333-3333-3333-333333333333') <> 1 then
    raise exception 'FAIL: D deleted C''s reflection';
  end if;
  if (select reflection_prompts_enabled from public.profiles where id = '33333333-3333-3333-3333-333333333333') is not true then
    raise exception 'FAIL: reflection prompts should default on';
  end if;
  if (select checkin_frequency from public.profiles where id = '33333333-3333-3333-3333-333333333333') <> 'off' then
    raise exception 'FAIL: check-ins must default to off';
  end if;
end $$;

-- Account deletion removes plans, steps and reflections.
delete from auth.users where id = '33333333-3333-3333-3333-333333333333';
do $$ begin
  if exists (select 1 from public.growth_plans where user_id = '33333333-3333-3333-3333-333333333333')
     or exists (select 1 from public.plan_steps where plan_id = 'aaaaaaaa-0000-0000-0000-000000000001')
     or exists (select 1 from public.reflections where user_id = '33333333-3333-3333-3333-333333333333') then
    raise exception 'FAIL: account deletion left growth data behind';
  end if;
end $$;

select 'ALL GROWTH RLS CHECKS PASSED' as result;
