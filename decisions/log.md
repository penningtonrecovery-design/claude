# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-11-10 — CareMAR prototype stack: Next.js 15 + TypeScript + Tailwind v4, client-side demo store
**Decision:** Build the CareMAR eMAR demo as a Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 app at the repo root. All demo data (residents, staff, orders, dose records, audit events) lives in a single typed `DemoState` persisted to the viewer's browser `localStorage`, with a "Reset demo data" control. Domain logic lives in pure, framework-free modules under `src/lib/` and is unit-tested with Vitest. A `supabase/schema.sql` documents the intended Postgres tables for a future production backend, but nothing connects to Supabase now.
**Reasoning:** The spec requires a demo that runs with no external credentials and no real patient data. Browser storage keeps the app deployable to any static/serverless host, keeps each prospect's demo isolated, and survives refreshes. Keeping the domain logic pure makes the later move to Postgres a data-layer swap instead of a rewrite, and makes the documentation rules testable.
**Context:** User chose "Browser storage + reset" over a local server file or live Supabase. This is a market-validation prototype, explicitly not for clinical use.

## 2026-11-10 — AI Administrative Assistant = deterministic rules engine + optional Claude wording
**Decision:** The assistant's findings (missing/overdue documentation, unreviewed exceptions, late entries, records against discontinued orders, etc.) come from a deterministic rules engine that always runs offline. If `ANTHROPIC_API_KEY` is set on the server, a Next.js API route may ask Claude (`claude-opus-5-5`) to rephrase those findings into a plain-language review summary under a strict non-clinical system prompt; the output is passed through a clinical-advice filter and falls back to the rules text if it trips. The assistant has no write access to any data and only receives the findings text.
**Reasoning:** In a healthcare demo, findings must be reproducible and explainable; an LLM shouldn't be the source of truth. The rules-first design means the demo always works (including offline pitches) and makes the safety story concrete: AI flags paperwork, humans decide, and AI can never change orders or doses.
**Context:** User asked Claude to choose the best option; this was the recommendation. Spec forbids clinical recommendations and AI-driven order/dose changes.

## 2026-11-10 — Simulated login: pick-a-staff screen + header role switcher
**Decision:** No passwords. The login screen lists fictional staff (Caregiver, Supervisor, Administrator); a header switcher lets a presenter change user in one click. Every action records the simulated staff identity in the audit trail. Role checks are enforced in the domain functions, not just hidden in the UI.
**Reasoning:** Fastest flow for live demos while still producing named actors in the audit trail and demonstrating role-based access. Real authentication is listed in the README as a production prerequisite.
**Context:** User chose this over a fake username/password form or a bare role toggle.

## 2026-11-10 — Dose status model and append-only records
**Decision:** Scheduled doses are derived from active medication orders (not stored). A dose's status is `documented` (administered), `exception` (refused / held / not administered), `overdue` (no record and more than the documentation window, 60 min by default, past its scheduled time), or `pending` (with a "due now" flag inside the window). Administration records are never edited: a correction is a new record that `supersedes` the earlier one and requires a correction reason. Audit events are append-only and chained with a non-cryptographic demo hash so tampering can be demonstrated; production would need SHA-256/WORM storage.
**Reasoning:** Mirrors how paper and electronic MARs are reviewed (scheduled time ± window), keeps corrections visible instead of silently overwriting, and gives the supervisor dashboard and reports one shared source of truth.
**Context:** Spec requires distinct pending/documented/overdue/exception statuses, explicit confirmation before saving, no auto-administration, and corrections recorded as new events.

## 2026-11-10 — Host the shareable demo as a private claude.ai Artifact (static single-file build)
**Decision:** Publish CareMAR for viewing from any device as a private claude.ai Artifact page, built by `npm run build:static`. That command bundles the existing Next.js pages into one self-contained HTML file with esbuild and the Tailwind CLI, swapping `next/link` and `next/navigation` for a small in-memory router that mirrors top-level views to `#name` hashes. A `NEXT_PUBLIC_STATIC_DEMO` flag hides features the artifact frame blocks: print is hidden, the audit export becomes copy-to-clipboard, and the AI assistant is forced into offline rules mode. The Next.js app remains the primary codebase and is unchanged in behaviour.
**Reasoning:** The cloud session's preview wasn't visible to the user, Vercel and Netlify APIs are not reachable from the session, and the user chose not to share a Vercel token. The app is already fully client-side with browser storage, so a static build keeps every workflow (simulated sign-in, role switching, documentation, review, audit, reports) without a server or credentials, and the link stays private until the user shares it.
**Context:** The user asked for a live link openable from any device. They chose "Publish as claude.ai link" over importing to Vercel themselves or a Netlify drag-and-drop. A Vercel deployment remains possible later by importing the GitHub repo in the Vercel dashboard.

## 2026-11-10 — Rename product from CareMAR to MARcheck
**Decision:** The product is now called **MARcheck** (capitalised to highlight MAR, Medication Administration Record; identifiers and filenames use lowercase `marcheck`). All user-facing text, the page title, the AI assistant's system prompt, export filenames, the package name, the static build output (`dist-static/marcheck.html`) and the README use the new name. The browser storage key changed to `marcheck-demo-state`; the old `caremar-demo-state` key is still read once so existing demo data carries over. Earlier entries in this log keep the old name as historical record.
**Reasoning:** The name "CareMAR" is already taken. The user first chose "Marcheck", then settled on the "MARcheck" capitalisation.
**Context:** Requested by the user after reviewing the hosted demo. The hosted demo link stays the same and is updated in place.
