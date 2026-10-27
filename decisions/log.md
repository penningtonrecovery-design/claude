# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-10-27 — Fatherly Friend MVP stack
**Decision:** Next.js 16 (App Router, TypeScript, Tailwind v4) at the repo root, Supabase (Postgres + Auth) for data and sign-in, OpenAI for text chat behind a provider interface, Retell AI for voice, Vercel for hosting.
**Reasoning:** Matches the product brief's preferred stack; the user already holds Retell and OpenAI accounts. The provider interface keeps the language model swappable.
**Context:** First build of the app; repo previously held only CLAUDE.md and this log.

## 2026-10-27 — Local Supabase first, hosted before deployment
**Decision:** Develop against the Supabase CLI's local Docker stack; create a hosted Supabase project only when deploying to Vercel. Schema lives in `supabase/migrations` so both use the same SQL.
**Reasoning:** No Supabase account yet; local keeps the first step free and private. Migrations make the later move mechanical.
**Context:** The cloud build workspace cannot pull Supabase's Docker images, so the full local stack runs on the user's machine; RLS policies are checked here against plain Postgres.

## 2026-10-27 — Sign-in: magic link (default) plus email and password
**Decision:** Offer email magic link as the primary sign-in and email + password as an alternative, including a password-reset flow. Social sign-in deferred.
**Reasoning:** User chose "both". Magic link avoids password reuse for a sensitive app; password covers men who prefer it.
**Context:** Asked during initial scoping.

## 2026-10-27 — Crisis resources: United States only at launch
**Decision:** Crisis screens show US resources (988 Suicide & Crisis Lifeline, Crisis Text Line, 911). Resources live in one data file so other countries can be added. Every entry is marked "verify before public release".
**Reasoning:** User's launch market is the US.
**Context:** Asked during initial scoping.

## 2026-10-27 — Keys stay off this workspace; integrations built but not verified live
**Decision:** Build the Retell and OpenAI integrations without live keys here. The app detects missing configuration and says so plainly instead of faking responses. Live verification happens on the user's machine with `.env.local`.
**Reasoning:** The user asked to proceed with the build; no keys are present in the cloud environment, and keys must never be pasted into chat.
**Context:** User said "go ahead and build" when offered live testing vs. local testing.

## 2026-10-27 — Retell voice via server proxy; API key never reaches the browser
**Decision:** Use `retell-client-js-sdk` v3 `RetellClient` with a custom `fetch` that routes only `POST /v3/create-web-call` to our authenticated `/api/voice/web-call` route, which injects the real API key and the server-configured agent ID. The live transcript stream is not enabled.
**Reasoning:** v3 deprecated the old access-token client; its documented private option is a proxy that keeps the key server-side. The transcript stream needs the key in the browser, so it is off.
**Context:** Found while reading the installed SDK (3.0.3). The voice persona prompt is configured in the Retell dashboard from the same prompt file used for text chat.

## 2026-10-27 — Data minimization defaults
**Decision:** Text chat transcripts are not stored by the app in this build (held in the browser for the session only). Memory is off by default; when on, only notes the user writes and approves are stored and fed to the model. OpenAI requests use `store: false`.
**Reasoning:** Brief requires memory to be optional and consent-based, and forbids storing sensitive details without safeguards. Storing nothing by default is the safest starting point; automatic memory extraction needs consent UX and review that come later.
**Context:** Phase 1 foundation. Retell's own call storage is configured in the Retell dashboard and is documented as an open item.

## 2026-10-27 — Layered safety screening before any model call
**Decision:** Every user text message is screened by a deterministic keyword classifier and, when OpenAI is configured, the moderation endpoint. Crisis-level messages get a fixed, reviewed response with US resources and never go to the language model. Distress-level messages go to the model with extra safety instructions and a resource banner.
**Reasoning:** Crisis handling must not depend on a generative model behaving well. Keyword lists miss things, so moderation adds a second signal; either signal escalates.
**Context:** Voice calls run inside Retell, so this screening does not see voice in real time — documented as a known gap.
