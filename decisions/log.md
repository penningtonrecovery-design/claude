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

## 2026-11-19 — Gym sales dashboard ("Revenue Recovery HQ") architecture
**Decision:** Build the private sales dashboard for selling the Fitness Revenue Recovery System to DFW gyms as a single private claude.ai artifact page. Its data lives in the artifact's built-in database (`db` capability), locked to the owner only. Data model: one `gyms` record per prospect, which holds contact details, outreach status, next action, the phone audit, the objection and the client terms. Separate `touches`, `meetings` (calls and proposals) and `results` (monthly client results) collections, plus a `settings/main` doc for weekly targets and calculator defaults.
**Reasoning:** The owner wants it to work on both desktop and phone with nothing to run. Browser storage would split the data between devices, while the artifact database syncs everywhere. Weekly actuals are counted automatically from logged touches and meetings, so there is no double entry. "Calls" are phone dials (audit, cold and follow-up calls). "Contacts" are touches where the decision maker was reached. "Calls booked" counts meetings by the date they were booked. Outreach status only moves forward automatically: a touch sets "contacted", a reply sets "replied", a meeting sets "call booked", a proposal sets "proposal sent", and won or lost outcomes set those statuses. It never moves backward on its own and stays editable by hand. Marking a gym won creates a client record. Marking it lost or stalled asks for the objection.
**Context:** The goal is 3 paying gym clients. The owner will import their 100 DFW gyms from a CSV. Defaults that are editable in the page: weekly targets of 25 calls, 15 contacts, 3 calls booked, 2 audits and 1 proposal. Audit revenue-lost calculator: 60 inquiries a month, a leak % suggested from the audit result, a 25% close rate, $60 a month dues and a 12-month member value. Client results are auto-flagged as case-study material when a month's recovered revenue is 3× or more the monthly fee.
