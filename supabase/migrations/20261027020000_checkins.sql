-- Opt-in, in-app check-ins. Off by default.

alter table public.profiles
  add column checkin_frequency text not null default 'off'
    check (checkin_frequency in ('off', 'weekly', 'biweekly', 'monthly')),
  add column checkin_enabled_at timestamptz,
  add column last_checkin_at timestamptz,
  add column last_checkin_key text check (char_length(last_checkin_key) <= 40);

comment on column public.profiles.checkin_frequency is 'How often an in-app check-in note may appear. Never sent outside the app.';
