-- Fatherly Friend: initial schema.
-- Every table holding personal data has row-level security enabled, and each
-- policy restricts a signed-in user to rows they own.

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  memory_enabled boolean not null default false,
  confirmed_adult_at timestamptz,
  acknowledged_limits_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user. Holds preferences and consent choices, not conversation content.';
comment on column public.profiles.memory_enabled is 'Explicit consent to store and use memories. Off by default.';

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Rows are created by the trigger below; users cannot insert or delete
-- profiles directly. Deleting the auth user cascades.

-- Memories -------------------------------------------------------------------

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  category text not null check (
    category in ('goal', 'experience', 'preference', 'challenge', 'achievement', 'other')
  ),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.memories is 'Notes the user has explicitly chosen to save. Only used when profiles.memory_enabled is true.';

create index memories_user_id_idx on public.memories (user_id, created_at desc);

alter table public.memories enable row level security;

create policy "memories: read own" on public.memories
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "memories: insert own" on public.memories
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "memories: update own" on public.memories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "memories: delete own" on public.memories
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Keep updated_at current ----------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger memories_touch before update on public.memories
  for each row execute function public.touch_updated_at();

-- Create a profile for each new auth user ------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Limit what the API roles can touch -----------------------------------------

revoke all on public.profiles, public.memories from anon;
revoke insert, delete on public.profiles from authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
