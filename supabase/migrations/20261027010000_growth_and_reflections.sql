-- Phase 2 core loop: growth plans, steps (progress), monthly reflections.

-- Profiles: reflection prompt preferences --------------------------------------

alter table public.profiles
  add column reflection_prompts_enabled boolean not null default true,
  add column reflection_snoozed_until timestamptz;

-- Growth plans ---------------------------------------------------------------

create table public.growth_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  topic text not null check (topic in (
    'confidence', 'identity', 'relationships', 'emotional_regulation', 'communication',
    'boundaries', 'career', 'financial_responsibility', 'fatherhood', 'personal_development'
  )),
  focus text check (char_length(focus) <= 300),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index growth_plans_user_idx on public.growth_plans (user_id, created_at desc);

alter table public.growth_plans enable row level security;

create policy "growth_plans: read own" on public.growth_plans
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "growth_plans: insert own" on public.growth_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "growth_plans: update own" on public.growth_plans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "growth_plans: delete own" on public.growth_plans
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger growth_plans_touch before update on public.growth_plans
  for each row execute function public.touch_updated_at();

-- Plan steps -----------------------------------------------------------------

create table public.plan_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.growth_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  position smallint not null default 0,
  content text not null check (char_length(content) between 1 and 280),
  source text not null default 'user' check (source in ('library', 'ai', 'user')),
  done_at timestamptz,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plan_steps_plan_idx on public.plan_steps (plan_id, position);

alter table public.plan_steps enable row level security;

-- A step must belong to the user AND sit on one of the user's own plans.
create policy "plan_steps: read own" on public.plan_steps
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "plan_steps: insert own" on public.plan_steps
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.growth_plans p
      where p.id = plan_id and p.user_id = (select auth.uid())
    )
  );
create policy "plan_steps: update own" on public.plan_steps
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.growth_plans p
      where p.id = plan_id and p.user_id = (select auth.uid())
    )
  );
create policy "plan_steps: delete own" on public.plan_steps
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger plan_steps_touch before update on public.plan_steps
  for each row execute function public.touch_updated_at();

-- Monthly reflections --------------------------------------------------------
-- Self-reported 1-5 ratings. Any area may be skipped (null). Not clinical.

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  confidence smallint check (confidence between 1 and 5),
  wellbeing smallint check (wellbeing between 1 and 5),
  relationships smallint check (relationships between 1 and 5),
  identity smallint check (identity between 1 and 5),
  responsibility smallint check (responsibility between 1 and 5),
  confidence_note text check (char_length(confidence_note) <= 500),
  wellbeing_note text check (char_length(wellbeing_note) <= 500),
  relationships_note text check (char_length(relationships_note) <= 500),
  identity_note text check (char_length(identity_note) <= 500),
  responsibility_note text check (char_length(responsibility_note) <= 500),
  proud_of text check (char_length(proud_of) <= 500),
  created_at timestamptz not null default now()
);

comment on table public.reflections is 'Self-reported monthly reflections. Never sent to the language model.';

create index reflections_user_idx on public.reflections (user_id, created_at desc);

alter table public.reflections enable row level security;

create policy "reflections: read own" on public.reflections
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reflections: insert own" on public.reflections
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reflections: delete own" on public.reflections
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.growth_plans, public.plan_steps, public.reflections from anon;
