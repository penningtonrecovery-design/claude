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

### Memory
Opt-in. Two ways in, both chosen by him: notes he writes in Settings (`source = 'settings'`),
and "Remember this" on his own text-chat messages (`source = 'conversation'`), which opens
an editor prefilled with his words. Both go through `checkMemory` (`src/lib/memory/save.ts`):
validation, plus crisis-level text is refused and he's pointed to help instead. Memories
reach the prompt only while `memory_enabled` is true. There is no AI extraction. Voice isn't
covered because the app receives no voice transcripts.

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

### Visual companion (Phase 3)
Settings → "How he appears": voice-only (the orb), one of five AI-generated grandfather
portraits, one per background (Black / African American, East Asian, Hispanic / Latino,
South Asian, White), or "Your photo". The portraits are static files in `public/companions/`
showing people who don't exist; `src/components/avatar-portrait.tsx` shows them in a circle
that glows and swells slightly with the voice, and Settings says they are AI-generated.
The keepsake photo flow:
1. The browser shrinks the image to at most 1600 px and sends it to the `uploadKeepsake`
   server action (body limit 4.4 MB, under Vercel's 4.5 MB).
2. `processKeepsakePhoto` checks the bytes really are JPEG/PNG/WebP, rejects tiny or
   oversized files, and re-encodes to a JPEG of at most 1000 px with `sharp`, dropping
   EXIF/GPS and other metadata.
3. It is stored at `keepsakes/<user id>/keepsake.jpg` in a private bucket; storage
   policies allow each user only their own folder.
4. Pages show it through a signed link valid for one hour. On the Talk page it sits in a
   still frame beside the orb with an optional caption and "Fatherly Friend is an AI".
   The photo and caption never reach the language model or Retell.
5. Removing the photo, or deleting the account (via the admin client, before the auth
   user), deletes the file.

### Knowledge base (Phase 3)
Structured entries in `src/lib/knowledge/entries.ts`, each with evidence level, caveats,
sources (with a verified flag) and review status. `selectKnowledge` picks at most two
**usable** entries (approved, named reviewer, date, all citations verified) whose keywords
appear in his last three messages; `renderKnowledge` adds them to the prompt before the
safety instructions. All entries are drafts today. See `docs/knowledge/REVIEW.md`.

### Personalization (Phase 3)
Fixed-vocabulary preferences on `profiles` (tone, focus, next-step frequency, faith,
topics to avoid, life context), each mapped to a reviewed instruction by
`renderPreferences`. Life context is included only with memory on. Preferences go into the
text prompt (before safety) and into Retell calls as the `{{preferences}}` dynamic variable.
"Tune how he talks to me" (`/api/preferences/suggest`) sends the in-browser conversation
once to the model, which may suggest up to three style changes (never faith or life
context); `parseSuggestions` validates every field and value and screens the reasons; no
suggestions are made if any of his messages shows risk. He accepts or skips each.

### Rate limits
Each costly request first calls the database function `consume_rate_limit(action)` as the
signed-in user (`src/lib/rate-limit.ts`). It counts uses per UTC minute and UTC day in
`rate_limits`, under an advisory lock so parallel requests can't slip past, and refuses
without counting once a limit is reached, saying how long until the window resets. The
limits are defined inside the function. For chat, tailoring and suggestions the check runs
after the safety screen and just before the model call, so a crisis message is never
blocked. Voice, photo upload and data export check before doing any work. A refusal returns
429 with a `Retry-After` header and a calm message the screens show as-is; if the check
itself errors, the request goes ahead and a warning is logged.

## Data model

| Table | Purpose | Access |
| --- | --- | --- |
| `auth.users` | Supabase accounts | Supabase Auth |
| `profiles` | name, memory consent, onboarding confirmations, reflection, check-in and appearance preferences, keepsake path and caption | user reads/updates own row; created by trigger; cascades on account deletion |
| `memories` | user-written notes (category + ≤500 chars) | user CRUD on own rows only |
| `growth_plans` | topic, focus, status | user CRUD on own rows |
| `plan_steps` | step text, source (library/ai/user), done, note | user CRUD on own rows; insert/update also require the parent plan to be the user's |
| `storage.objects` (bucket `keepsakes`) | keepsake photo, one per user | user reads/writes only `<own id>/…`; private bucket |
| `rate_limits` | usage counts per action, minute and day (no content) | no direct access; only through `consume_rate_limit` |
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
- Possible later opt-in: AI-suggested memories he approves.
- Clinician review and approval of knowledge-base entries.
- A model-based risk check, pending red-team results (see docs/safety/README.md).
- Knowledge and per-turn safety for voice via Retell's custom LLM integration.
- Voice safety parity: route voice turns through the same safety pipeline (Retell custom
  LLM websocket) or add post-call review.
