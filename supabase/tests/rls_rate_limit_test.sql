-- Rate limit checks. Each block raises an exception on failure.

insert into auth.users (id, email) values
  ('77777777-7777-7777-7777-777777777777', 'g@example.test'),
  ('88888888-8888-8888-8888-888888888888', 'h@example.test');

-- H has already used today's chat allowance.
insert into public.rate_limits (user_id, action, window_kind, window_start, count)
values ('88888888-8888-8888-8888-888888888888', 'chat', 'day',
        date_trunc('day', now() at time zone 'utc') at time zone 'utc', 200);

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777"}', false);

-- G gets 10 chat messages a minute, then is told to wait under a minute.
do $$
declare r record;
begin
  for i in 1..10 loop
    select * into r from public.consume_rate_limit('chat');
    if not r.allowed then raise exception 'FAIL: chat message % refused', i; end if;
  end loop;
  select * into r from public.consume_rate_limit('chat');
  if r.allowed or r.limit_window <> 'minute' or r.retry_after_seconds not between 1 and 60 then
    raise exception 'FAIL: 11th chat message in a minute not refused correctly (%)', r;
  end if;
  -- Other actions have their own counters.
  select * into r from public.consume_rate_limit('voice');
  if not r.allowed then raise exception 'FAIL: voice refused because of chat use'; end if;
  begin
    perform public.consume_rate_limit('anything');
    raise exception 'FAIL: unknown action accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Users can't read or change the counters directly.
do $$ begin
  begin
    perform 1 from public.rate_limits;
    raise exception 'FAIL: user read rate_limits';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.rate_limits;
    raise exception 'FAIL: user reset rate_limits';
  exception when insufficient_privilege then null;
  end;
end $$;

-- H is over the daily limit and is told to wait until the day resets.
select set_config('request.jwt.claims', '{"sub":"88888888-8888-8888-8888-888888888888"}', false);
do $$
declare r record;
begin
  select * into r from public.consume_rate_limit('chat');
  if r.allowed or r.limit_window <> 'day' or r.retry_after_seconds not between 1 and 86400 then
    raise exception 'FAIL: daily chat limit not enforced (%)', r;
  end if;
end $$;

-- Anonymous visitors can't use the function at all.
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
do $$ begin
  begin
    perform public.consume_rate_limit('chat');
    raise exception 'FAIL: anon called consume_rate_limit';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- A refused request is not counted, and deleting an account removes its counters.
do $$ begin
  if (select count from public.rate_limits
      where user_id = '77777777-7777-7777-7777-777777777777' and action = 'chat' and window_kind = 'minute') <> 10 then
    raise exception 'FAIL: refused request was counted';
  end if;
  delete from auth.users where id = '77777777-7777-7777-7777-777777777777';
  if exists (select 1 from public.rate_limits where user_id = '77777777-7777-7777-7777-777777777777') then
    raise exception 'FAIL: counters survived account deletion';
  end if;
end $$;

select 'RATE LIMIT CHECKS PASSED';
