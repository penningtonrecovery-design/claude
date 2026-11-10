-- MARcheck — FUTURE production schema sketch for PostgreSQL / Supabase.
-- NOT used by the demo (the demo stores fictional data in the browser).
-- This is a starting point for design review, not a validated clinical data model.

create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  documentation_window_minutes int not null default 60 check (documentation_window_minutes between 15 and 240),
  created_at timestamptz not null default now()
);

-- Staff are linked to Supabase Auth users (auth.users) — real authentication replaces the demo picker.
create table staff (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  auth_user_id uuid unique references auth.users(id),
  name text not null,
  title text,
  role text not null check (role in ('caregiver','supervisor','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table residents (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  first_name text not null,
  last_name text not null,
  preferred_name text,
  room text not null,
  birth_date date,
  allergies text[] not null default '{}',
  physician text,
  notes text,
  active boolean not null default true,
  admitted_on date
);

create table caregiver_assignments (
  staff_id uuid references staff(id),
  resident_id uuid references residents(id),
  primary key (staff_id, resident_id)
);

-- Orders should originate from a verified prescriber/pharmacy workflow in production.
create table medication_orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  resident_id uuid not null references residents(id),
  name text not null,
  strength text,
  form text,
  dose text not null,
  route text not null,
  times time[] not null,
  instructions text,
  indication text,
  prescriber text,
  start_date date not null,
  status text not null check (status in ('active','discontinued')),
  discontinued_at timestamptz,
  discontinued_reason text
);

-- Append-only: no UPDATE/DELETE grants. Corrections insert a new row with supersedes_id.
create table administration_records (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  dose_key text not null,               -- order_id@YYYY-MM-DDTHH:MM
  order_id uuid not null references medication_orders(id),
  resident_id uuid not null references residents(id),
  scheduled_at timestamptz not null,
  outcome text not null check (outcome in ('administered','refused','held','not_administered')),
  reason text,
  note text,
  staff_id uuid not null references staff(id),
  recorded_at timestamptz not null default now(),   -- server time, never client-supplied
  supersedes_id uuid references administration_records(id),
  correction_reason text,
  check (outcome = 'administered' or reason is not null),
  check (supersedes_id is null or correction_reason is not null)
);
create unique index one_correction_per_record on administration_records(supersedes_id) where supersedes_id is not null;

create table exception_reviews (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  dose_key text not null,
  reviewer_id uuid not null references staff(id),
  at timestamptz not null default now(),
  action text not null check (action in ('acknowledged','escalated')),
  note text not null,
  escalated_to text
);

-- Append-only audit log with hash chain (SHA-256 computed server-side, e.g. in a trigger).
create table audit_events (
  seq bigserial primary key,
  facility_id uuid not null references facilities(id),
  at timestamptz not null default now(),
  actor_id uuid,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  data jsonb,
  prev_hash text not null,
  hash text not null
);

-- Enforce append-only at the database level.
revoke update, delete on administration_records, exception_reviews, audit_events from authenticated, anon;

-- Tenant isolation: every table gets RLS keyed on the caller's facility, e.g.
alter table residents enable row level security;
create policy residents_same_facility on residents
  using (facility_id = (select facility_id from staff where auth_user_id = auth.uid()));
-- …repeat for every table, plus role-specific policies (caregivers: assigned residents only).
