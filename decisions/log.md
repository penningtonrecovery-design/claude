# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-11-13 — Niche-targeting model for P&G AI Consulting (AI Niche Radar dashboard)
**Decision:** Rank US SMB niches with a 0–100 opportunity score: 25% pain, 25% timing (demand peaks in the next 90 days), 20% budget, 15% reachability of the decision-maker, 15% speed to ROI. As of Nov 2026, the top targets are HVAC/plumbing, CPA/tax firms (install window closes mid-December before busy season), insurance agencies (Medicare/ACA enrollment), and dental (year-end benefits recall). Retail/e-commerce is deferred to Q1.
**Reasoning:** P&G sells across automations, AI agents, strategy/training and custom builds, so niches are ranked on buyer pain and seasonal timing, not on service fit. 2026 surveys show owners hold back mainly over unclear ROI (74%), ease of use (73%) and data security (~50%), so lead offers are narrow, fast-ROI installs such as missed-call recovery, intake and recall.
**Context:** Built as the "AI Niche Radar" Data dashboard (claude.ai artifact) using US-nationwide scope, Ocean look. Ratings and retainer ranges are judgment calls from web research, not measured data. Revisit monthly as seasonal windows shift.
