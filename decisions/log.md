# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-09-02 — Free instant website audit lead magnet: architecture
**Decision:** Build the "free instant website & online-presence audit" page as a Next.js (App Router) + TypeScript app, deployed to Vercel. Server-side API route fetches the submitted URL, parses the HTML, computes lightweight heuristics (response time, page weight, meta/viewport presence, etc.) as a load-speed proxy, and sends everything to the Anthropic Claude API to produce a 7-criteria JSON scorecard (good/needs-work/critical + one tip each). Results render as a traffic-light report card. The closing "Book a free 15-min call" CTA is a lead-capture form only (name, email, business) — no live scheduling embed. Leads are appended to a Google Sheet via a service account (chosen over a database since the business owner wants to browse leads directly without extra tooling). No outbound lead-notification email is wired up yet. Branding/visual design is created fresh (no existing P&G AI Consulting brand assets provided); page/footer contact info ships as clearly-marked placeholders pending real business contact details.
**Reasoning:** Next.js is the most direct path to a Vercel-hosted app with server API routes for the fetch/parse/LLM/sheet-write logic and a React UI for the report card. Claude was chosen as the scoring LLM. Google Sheets avoids managing a database for a simple, low-volume lead list while still being durable and easy for a non-technical owner to check. This session has no Vercel account/token or Google service account credentials connected, so the deliverable is a complete, deploy-ready repo with documented env vars rather than a live deployment performed by Claude.
**Context:** Decided via one-at-a-time clarifying questions per the CLAUDE.md confidence-threshold rule, in response to the user's lead-magnet page request for P&G AI Consulting.
