# Architecture

## Overview

```
Browser (Next.js pages, React)
  │  HTTPS, Supabase session cookie
  ▼
Next.js on Vercel
  ├─ src/proxy.ts                  refreshes session, guards /talk and /settings
  ├─ Server Components             read profile/memories as the user (RLS applies)
  ├─ Server Actions                onboarding, settings, memory notes, account deletion
  ├─ /api/chat                     safety screen → (fixed crisis reply | language model)
  ├─ /api/voice/web-call           Retell proxy: adds API key + agent ID server-side
  └─ /api/account/export           JSON export of everything stored
        │                 │                     │
        ▼                 ▼                     ▼
  Supabase (Auth +   OpenAI (Responses +   Retell AI (voice agent,
  Postgres + RLS)    Moderation APIs)      WebRTC audio to the browser)
```

## Key flows

### Sign-in
Supabase Auth with two methods: email magic link (default) and email + password (with
confirmation email and reset). Links return to `/auth/callback`, which exchanges the code
for a session cookie and redirects only to on-site paths (`safeNextPath`). `src/proxy.ts`
refreshes the session on each request and sends signed-out visitors away from private pages.

### Onboarding
On first visit to `/talk`, the user sees a short form: optional name, memory on/off
(default off), and two required confirmations (18+, and that this is an AI that is not a
therapist or crisis service). Timestamps of those confirmations are stored on `profiles`.

### Text conversation
1. The browser keeps the conversation in memory and posts the recent messages to `/api/chat`.
2. The route validates input (roles, lengths, count), checks the session, and loads the
   name and, only if memory is on, the user's memory notes.
3. `respond()` (`src/lib/chat/respond.ts`) screens the latest message:
   - keyword classifier (`src/lib/safety/classifier.ts`), then
   - OpenAI moderation, if configured (either signal escalates).
4. **Crisis** → a fixed, pre-written response with 988/911. The model is not called.
   **Distress/abuse** → the model is called with extra safety instructions, and the UI
   pins crisis resources. **None** → normal reply.
5. The reply comes from the configured `ChatProvider` (OpenAI Responses API, `store: false`).
6. Nothing is written to the database.

### Voice conversation
1. The browser loads `retell-client-js-sdk` and creates a `RetellClient` whose `fetch` is
   overridden: the SDK's only request (`POST /v3/create-web-call`) goes to
   `/api/voice/web-call`; anything else is refused.
2. The route checks the session, builds the request body itself (server-side agent ID,
   `user_name` dynamic variable), adds the Retell API key, and forwards it to Retell.
3. Retell returns short-lived call credentials; audio flows browser ↔ Retell over WebRTC.
4. Pause = mute the mic, End = leave the call; interruption is handled by Retell.

### Memory (Phase 1)
Opt-in. Only notes the user writes in Settings are stored (`memories` table), and they're
added to the prompt only while `memory_enabled` is true. Automatic memory extraction from
conversations is deferred to Phase 2; it needs consent UX, review and safeguards.

### Growth plans (Phase 2)
1. `/plans/new`: he picks one of 10 topics (`src/lib/growth/library.ts`), optionally writes
   his focus, and ticks or edits 1–5 steps. Library steps are fixed, reviewable text.
2. Optional tailoring: `/api/plans/tailor` screens his focus (keywords + moderation; a
   crisis-level focus returns crisis resources, no model call), asks the model for JSON
   steps, validates shape and length, and drops any step that fails `classifySuggestion`
   (the safety screen read in both second and first person). Nothing is saved here.
3. `createPlan` saves the plan and steps. On `/plans` he ticks steps (optimistic UI), adds
   notes, edits or removes steps, adds his own (max 5), completes, sets aside or deletes a plan.
4. With memory on, `/api/chat` adds up to 3 active plans' open steps to the prompt with a
   "never pressure him" instruction.

### Monthly reflection (Phase 2)
`/reflect`: five areas rated 1–5 or skipped, optional note each, and "proud of". History
table shows the trend, oldest to newest. `isReflectionDue` offers one 30 days after
onboarding or the last reflection; "Not now" snoozes 7 days; Settings turns reminders off.
The reminder is an in-app banner on `/talk` and `/plans` only. Reflections are never sent
to the model.

### Check-ins (Phase 2)
Opt-in from Settings (off, weekly, every two weeks, monthly). `isCheckinDue` waits one full
interval after he turns them on, then one interval after he last answered or dismissed one.
The Talk page shows a note from the fixed library in `src/lib/checkins.ts`. With memory on,
some notes name one of his open plan steps. A due monthly reflection takes precedence, so
only one prompt shows at a time. **Reply** adds the note to the text chat as Fatherly
Friend's next message; **Thanks** dismisses it. Both record `last_checkin_at`. Nothing is
sent outside the app, and no AI writes the notes.

## Data model

| Table | Purpose | Access |
| --- | --- | --- |
| `auth.users` | Supabase accounts | Supabase Auth |
| `profiles` | name, memory consent, onboarding confirmations, reflection and check-in preferences | user reads/updates own row; created by trigger; cascades on account deletion |
| `memories` | user-written notes (category + ≤500 chars) | user CRUD on own rows only |
| `growth_plans` | topic, focus, status | user CRUD on own rows |
| `plan_steps` | step text, source (library/ai/user), done, note | user CRUD on own rows; insert/update also require the parent plan to be the user's |
| `reflections` | five 1–5 ratings (nullable), notes, proud-of | user read/insert/delete own; no edits |

## Provider abstraction
`ChatProvider` (`src/lib/ai/types.ts`) has one method, `generate({ system, messages })`.
OpenAI is the only implementation. Add another by implementing the interface and
registering it in `src/lib/ai/index.ts` under a new `AI_PROVIDER` value.

## Configuration
All configuration comes from environment variables (`.env.example`). `src/lib/config.ts`
reports missing services instead of throwing, so the UI can say "not configured".

## Next.js 16 notes
- `middleware` is now `proxy` (`src/proxy.ts`).
- Cache Components is on: anything that reads the session sits inside `<Suspense>`, and
  `createClient()` calls `connection()` so session reads are never prerendered.

## Planned (later phases)
- Phase 2, remaining: advanced memory (suggested memories from conversations, approved by him).
- Phase 3: avatar choice, personal photo option (secure storage, no impersonation),
  expanded reviewed knowledge base, further safety evaluation.
- Voice safety parity: route voice turns through the same safety pipeline (Retell custom
  LLM websocket) or add post-call review.
