-- Per-user rate limits for the endpoints that cost money or heavy work.
-- Counters are kept per user, action and fixed window (UTC minute and UTC
-- day). The limits live here, inside the function, so a caller cannot choose
-- its own. Users never read or write the table directly.

create table public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('chat', 'voice', 'tailor', 'suggest', 'upload', 'export')),
  window_kind text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, action, window_kind, window_start)
);

alter table public.rate_limits enable row level security;
-- No policies: no direct access for anon or authenticated users.
revoke all on public.rate_limits from anon, authenticated;

comment on table public.rate_limits is 'Usage counters for rate limiting. Holds no conversation content.';

-- Records one use of an action by the signed-in user if it is within the
-- limits, and reports whether it was allowed. When refused, nothing is
-- counted, and retry_after_seconds says when the blocking window resets.
create function public.consume_rate_limit(p_action text)
returns table (allowed boolean, limit_window text, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  per_minute integer;
  per_day integer;
  minute_start timestamptz := date_trunc('minute', now());
  day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  used_minute integer;
  used_day integer;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select l.per_minute, l.per_day into per_minute, per_day
  from (values
    ('chat', 10, 200),
    ('voice', 3, 10),
    ('tailor', 3, 10),
    ('suggest', 2, 5),
    ('upload', 3, 10),
    ('export', 2, 5)
  ) as l (action, per_minute, per_day)
  where l.action = p_action;

  if per_minute is null then
    raise exception 'unknown rate limit action' using errcode = '22023';
  end if;

  -- One caller at a time per user and action, so parallel requests can't
  -- slip past the limit together.
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_action, 0));

  select coalesce(sum(r.count) filter (where r.window_kind = 'minute' and r.window_start = minute_start), 0),
         coalesce(sum(r.count) filter (where r.window_kind = 'day' and r.window_start = day_start), 0)
    into used_minute, used_day
  from public.rate_limits r
  where r.user_id = uid and r.action = p_action;

  if used_day >= per_day then
    return query select false, 'day'::text,
      greatest(1, ceil(extract(epoch from (day_start + interval '1 day' - now())))::integer);
    return;
  end if;
  if used_minute >= per_minute then
    return query select false, 'minute'::text,
      greatest(1, ceil(extract(epoch from (minute_start + interval '1 minute' - now())))::integer);
    return;
  end if;

  insert into public.rate_limits as r (user_id, action, window_kind, window_start, count)
  values (uid, p_action, 'minute', minute_start, 1), (uid, p_action, 'day', day_start, 1)
  on conflict (user_id, action, window_kind, window_start) do update set count = r.count + 1;

  -- Keep the table small: drop this user's finished windows.
  delete from public.rate_limits r
  where r.user_id = uid
    and ((r.window_kind = 'minute' and r.window_start < minute_start)
      or (r.window_kind = 'day' and r.window_start < day_start));

  return query select true, null::text, 0;
end;
$$;

revoke all on function public.consume_rate_limit(text) from public, anon;
grant execute on function public.consume_rate_limit(text) to authenticated;
