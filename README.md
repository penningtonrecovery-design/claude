# Fatherly Friend

A voice-first AI companion for adult men who grew up without the fatherly guidance they
needed. He speaks like a warm, steady grandfather: he listens first, asks one question
at a time, offers practical wisdom, and is honest that he's an AI and not a therapist.

This repository holds the **Phase 1 foundation** (landing page, sign-in, onboarding, a
private conversation screen with voice and text, consent-based memory notes, data export and
deletion, essential safety handling) and the **Phase 2 core loop** (growth plans, progress
tracking, monthly reflections, in-app check-ins).

> **Not ready for the public.** The psychological guidance, safety wording and crisis
> resources need qualified professional review first. See
> [docs/LAUNCH_READINESS.md](docs/LAUNCH_READINESS.md).

## What works today

| Area | Status |
| --- | --- |
| Landing, privacy and crisis-help pages | Working |
| Sign-in: email magic link, email + password, password reset | Built; needs Supabase running |
| Onboarding (name optional, 18+ and "what this is" confirmations, memory choice) | Working |
| Text conversation via OpenAI | Built and unit-tested; **not yet verified against the live OpenAI API** |
| Voice conversation via Retell | Built and unit-tested; **not yet verified against a live Retell agent** |
| Safety screening and fixed crisis response | Working; tested end to end in the browser |
| Memory notes (opt-in), export, account deletion | Working |
| Growth plans: 10 topics, starter step library, edit/add/remove steps, progress and notes | Working |
| AI-tailored plan steps | Built and unit-tested; **not yet verified against the live OpenAI API** |
| Monthly reflections (1–5 per area, optional words, history, in-app reminder with snooze) | Working |
| Check-ins (opt-in, in-app only, pre-written notes; weekly / two-weekly / monthly) | Working |
| Row-level security (each user sees only their own data) | Tested against Postgres |

Without keys, the app says plainly that voice or text isn't configured, rather than
faking replies. Crisis messages still get the fixed crisis response even with no AI key.

## Run it locally

You need **Node.js 20.9+** and **Docker Desktop** (for the local Supabase stack).

```bash
npm install
npx supabase start          # first run downloads images; prints URLs and keys
cp .env.example .env.local  # then fill it in (see below)
npm run dev                 # http://localhost:3000
```

Fill `.env.local` from the output of `npx supabase start`:

- `NEXT_PUBLIC_SUPABASE_URL`: the **API URL** (usually `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the **publishable** key (older CLIs call it `anon key`)
- `SUPABASE_SECRET_KEY`: the **secret** key (older CLIs: `service_role key`)

Then add your `OPENAI_API_KEY` and `OPENAI_MODEL`, and your `RETELL_API_KEY` and
`RETELL_AGENT_ID` once you've set up the agent ([docs/RETELL_SETUP.md](docs/RETELL_SETUP.md)).
Restart `npm run dev` after editing `.env.local`.

**Sign-in emails go nowhere real locally.** Supabase catches them in a test inbox at
<http://127.0.0.1:54324>. Open it to click your magic link or confirmation link.

`npx supabase start` applies the migrations in `supabase/migrations` automatically. To
rebuild the database from scratch: `npx supabase db reset`.

## Tests

```bash
npm test            # unit tests: safety screening, crisis bypass, persona rules, API routes
npm run test:rls    # row-level security checks; needs a local Postgres you can reach as superuser
npm run typecheck
npm run lint
```

`test:rls` runs against plain Postgres with a minimal stand-in for Supabase's `auth`
schema (`supabase/tests/auth_shim.sql`). Never run that shim against a real Supabase
database.

## Project layout

```
src/app/                 pages and API routes (Next.js App Router)
  page.tsx               landing
  login/, reset-password/, update-password/, auth/   sign-in flows
  talk/                  onboarding + conversation (voice and text)
  plans/                 growth plans: list, progress, notes; plans/new builder
  reflect/               monthly reflection form and history
  settings/              name, memory notes, reminders, export, delete account
  help/, privacy/        crisis resources, plain-language privacy
  api/chat/              text conversation endpoint
  api/voice/web-call/    Retell proxy (holds the API key)
  api/plans/tailor/      AI-tailored plan step suggestions
  api/account/export/    data export
src/lib/
  persona/               the Fatherly Friend prompt (shared by text and voice)
  safety/                risk classifier, moderation, crisis responses, resources
  ai/                    language-model provider interface + OpenAI
  chat/                  request validation, safety-first response pipeline
  growth/                step library, AI tailoring, reflection schedule and schemas
  checkins.ts            check-in note library and schedule
  supabase/              server, browser and proxy clients
src/proxy.ts             session refresh + private-page guard (Next 16's "middleware")
supabase/migrations/     database schema and row-level security
supabase/tests/          RLS checks
docs/                    architecture, privacy/security, Retell setup, launch checklist
decisions/log.md         why things are the way they are
```

## Further reading

- [Architecture](docs/ARCHITECTURE.md)
- [Security and privacy assumptions](docs/SECURITY_AND_PRIVACY.md)
- [Retell voice agent setup](docs/RETELL_SETUP.md)
- [Launch readiness checklist](docs/LAUNCH_READINESS.md)
