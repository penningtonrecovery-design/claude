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

## 2026-10-27 — Phase 2 starts with the core loop
**Decision:** Build growth plans, progress tracking and monthly reflections first. Advanced memory and check-ins follow in a second pass.
**Reasoning:** These three form a usable loop (choose a focus → act → reflect) without new external services. Check-ins need an email or push provider, and memory from conversations raises consent questions, both of which need separate decisions.
**Context:** User chose "core loop" when Phase 2 began.

## 2026-10-27 — Plan steps: reviewed library plus optional AI tailoring
**Decision:** Each of the 10 topics has a written library of small steps. A man picks a topic, optionally describes his focus, and chooses or edits 3–5 steps. If OpenAI is configured he can ask for steps tailored to his focus; tailored steps are validated (length, count, JSON shape) and each is run through the safety classifier, and anything flagged is dropped. His focus text is safety-screened first, and a crisis-level focus gets crisis resources instead of a plan.
**Reasoning:** The library works without keys and is fixed text a professional can review. AI tailoring adds personalisation; the man edits or declines everything.
**Context:** User chose "library plus AI".

## 2026-10-27 — Monthly reflection: 1–5 self-rating per area, optional words
**Decision:** Five areas (confidence, emotional well-being, relationships, identity, personal responsibility), each rated 1–5 or skipped, with an optional note each and one "proud of" question. Offered in-app 30 days after onboarding or the last reflection; "Not now" snoozes for 7 days; can be turned off in Settings. Never sent by email or push. Always labelled self-reported, not clinical.
**Reasoning:** Quick to complete and makes his own trend visible. Snooze and off switch avoid nagging or guilt.
**Context:** User chose the 1–5 scale.

## 2026-10-27 — Plans are visible to conversations only when memory is on
**Decision:** With memory on, active plans and their unfinished steps are added to the conversation prompt. Reflection scores and notes are never sent to the language model.
**Reasoning:** Consistent with the memory consent model: memory-off means nothing carries into conversations. Scores are sensitive and add little to a conversation.
**Context:** Default stated to the user at the start of Phase 2.

## 2026-10-27 — Check-ins are in-app only, from a written library
**Decision:** Check-ins are opt-in (off by default) notes on the Talk page, at a frequency he picks (weekly, every two weeks, monthly). Text comes from a fixed, reviewable library; with memory on, some notes name one of his open plan steps. Nothing is sent by email or push. A note stays until he taps Thanks or Reply; Reply opens text chat with the note as the opening line. When a monthly reflection is due, the check-in waits.
**Reasoning:** User chose in-app delivery and a written library. Fixed wording lets a professional review every message and lets tests enforce the no-guilt, no-dependency rules (no "we miss you", no streaks, no "you haven't"). Showing one prompt at a time avoids nagging.
**Context:** Phase 2, second pass. The first check-in comes one full interval after he turns them on.

## 2026-10-27 — Advanced memory starts as a "Remember this" button, no AI
**Decision:** In text chat, each of his own messages gets a "Remember this" button while memory is on. It opens an inline editor prefilled with his words (trimmed to 500 characters) and a category; saving stores it in `memories` with `source = 'conversation'`. Nothing is saved unless he taps Save. The server refuses to save crisis-level text and points him to help instead. Voice isn't covered because the app receives no voice transcripts.
**Reasoning:** User chose the button over AI-suggested memories. It keeps memory entirely in his hands, with no model reading whole conversations. Blocking crisis text stops the most painful moments from being fed back into every future conversation without review.
**Context:** Last part of Phase 2. AI-suggested memories remain a possible later opt-in.

## 2026-11-13 — Niche-targeting model for P&G AI Consulting (AI Niche Radar dashboard)
**Decision:** Rank US SMB niches with a 0–100 opportunity score: 25% pain, 25% timing (demand peaks in the next 90 days), 20% budget, 15% reachability of the decision-maker, 15% speed to ROI. As of Nov 2026, the top targets are HVAC/plumbing, CPA/tax firms (install window closes mid-December before busy season), insurance agencies (Medicare/ACA enrollment), and dental (year-end benefits recall). Retail/e-commerce is deferred to Q1.
**Reasoning:** P&G sells across automations, AI agents, strategy/training and custom builds, so niches are ranked on buyer pain and seasonal timing, not on service fit. 2026 surveys show owners hold back mainly over unclear ROI (74%), ease of use (73%) and data security (~50%), so lead offers are narrow, fast-ROI installs such as missed-call recovery, intake and recall.
**Context:** Built as the "AI Niche Radar" Data dashboard (claude.ai artifact) using US-nationwide scope, Ocean look. Ratings and retainer ranges are judgment calls from web research, not measured data. Revisit monthly as seasonal windows shift.

## 2026-11-21 — Phase 3 starts with the visual companion
**Decision:** Build the presentation modes first: voice-only (the existing orb), a choice of illustrated grandfather avatars, or a personal photo shown as a keepsake. Safety evaluation and the knowledge base come after.
**Reasoning:** User's choice. It is concrete, needs no new outside service beyond Supabase storage, and gives something visible to try.
**Context:** Phase 3 kickoff, after Phases 1–2 were merged.

## 2026-11-21 — Avatars are stylized illustrations drawn in code
**Decision:** Four illustrated grandfather portraits as inline SVG, varied in features and skin tone, clearly illustrations rather than photographs. They glow gently with the voice while he speaks.
**Reasoning:** No cost or outside service, consistent style, and no risk of resembling a real person or blurring the "this is an AI" line, which realistic AI-generated faces would.
**Context:** User chose stylized illustrations over AI-generated portraits or commissioned art.

## 2026-11-21 — Personal photo is a still keepsake, never Fatherly Friend's face
**Decision:** An uploaded photo of a meaningful father figure appears as a still, framed picture beside Fatherly Friend, with "Fatherly Friend is an AI" always shown beneath it. It never animates or speaks. The optional caption is never sent to the AI, nor is the photo. The server re-encodes every upload (removing location and other metadata), stores it in a private bucket under the user's own folder, and serves it only through short-lived signed links. One photo per user; he confirms he has the right to use it; deleting the photo or the account removes the file.
**Reasoning:** The brief forbids using the photo to impersonate the person in it. Showing it as a keepsake gives the personal connection without the AI appearing to speak as that person.
**Context:** User chose "framed keepsake" over using the photo as the companion's face or keeping it on a separate page.

## 2026-11-21 — Patch Next.js to 16.4.6 for security advisories
**Decision:** Upgrade `next` and `eslint-config-next` from 16.4.3 to 16.4.6 (patch release).
**Reasoning:** npm's advisory database lists seven moderate advisories for Next.js 16.0–16.4.4, several in Cache Components, which this app uses, and Next refused to build until patched. The remaining audit findings are in `minimatch`, used only by development linting tools.
**Context:** Found while building the visual companion. Applied with a plain `npm install`; all tests and the build pass on 16.4.6.
