# Security and privacy assumptions

What this build does, what it relies on, and what it doesn't do yet.

## What is stored, and where

| Data | Where | Notes |
| --- | --- | --- |
| Email, password hash, sessions | Supabase Auth | Password min. 10 chars; email confirmation on |
| Name (optional), memory consent, onboarding confirmations | `public.profiles` | No conversation content |
| Memory notes (opt-in) | `public.memories` | Only what the user writes; deletable individually or all at once |
| Growth plans, steps, step notes | `public.growth_plans`, `public.plan_steps` | Open steps reach the model only with memory on; focus text is sent to OpenAI only when he asks for tailoring |
| Monthly reflections | `public.reflections` | Never sent to the model; can't be edited, only deleted |
| Text conversation | **Not stored by the app** | Lives in the browser tab only. Sent to OpenAI per message |
| Voice audio and transcripts | Retell AI | Depends on the agent's data-storage setting. **Must be configured and documented before launch** |
| Server logs | Vercel | Routes log only status codes and generic errors, never message content |

## Controls in place

- **Row-level security** on every personal table; each policy restricts access to the
  signed-in user's own rows. Users can't insert or delete profile rows directly. Tested by
  `npm run test:rls`, including a mutation check that disabling RLS fails the test.
- **Keys stay server-side.** OpenAI, Retell and Supabase secret keys are read only in
  server code. Browser-visible values are the Supabase URL and publishable key, which are
  designed to be public and protected by RLS.
- **Retell proxy is allow-listed.** It forwards only create-web-call, builds the body
  itself (the browser can't choose the agent), and doesn't pass Retell's error bodies back.
- **Input validation** on all API routes and server actions (zod): roles limited to
  user/assistant (no injected system messages), length and count limits.
- **Open-redirect protection** on sign-in callbacks.
- **Data minimisation:** no transcript storage, memory off by default, OpenAI `store: false`,
  name is optional and is the only profile detail shared with Retell.
- **Export and deletion:** JSON export of everything stored; account deletion removes the
  auth user and cascades to profile and memories.
- **Encryption:** in transit via HTTPS (Vercel, Supabase, OpenAI, Retell). At rest,
  Supabase's hosted Postgres encrypts storage (verify on the chosen plan). There is no
  application-level encryption of memory notes yet.

## Assumptions

- Supabase's hosted platform and Auth are configured with production settings (custom
  SMTP, rate limits, redirect allow-list for the real domain).
- Vercel environment variables are the only place secrets live.
- OpenAI's API data-usage terms apply (not used for training by default for API traffic;
  abuse-monitoring retention may still apply). Verify current terms.

## Not done yet (tracked in LAUNCH_READINESS.md)

- Rate limiting on `/api/chat`, `/api/plans/tailor` and `/api/voice/web-call` (cost and abuse control).
- Application-level encryption for memory notes.
- Security headers / Content-Security-Policy review.
- Retell data-storage configuration and privacy-page wording for voice.
- Audit logging for account deletion and exports (without content).
- Real-time safety screening for voice conversations.
- Formal privacy policy and terms; we deliberately don't claim "completely confidential".
