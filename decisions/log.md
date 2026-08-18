# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-08-18 — Missed-call-to-callback automation: Gmail-relay trigger, manual Zap build
**Decision:** For the "missed call → AI receptionist callback" automation, use Google Voice's Gmail notification email as the Zapier trigger (New Email Matching Search on Gmail, filtered to Google Voice's missed-call/voicemail sender), rather than a direct Google Voice trigger. The downstream action creates/updates the caller as a contact in GoHighLevel (Zapier app: LeadConnector, action `add_update_contact`) and then fires the existing GHL workflow via the `campaign` action (label "Workflow ID"), which already contains the call-back/text/email logic. The actual Zap (trigger + steps) is being hand-built by the user in the Zapier web editor, using step-by-step instructions provided in chat — not created programmatically through the Zapier MCP tools available in this session.
**Reasoning:** Google Voice has no public API and thus no native Zapier trigger, so the standard workaround is parsing its email notifications. GoHighLevel already owns the branching logic (call vs. text vs. email), so Zapier's only job is to get the caller's contact info into GHL and kick off that workflow — avoiding duplicating decision logic in two places. The Zapier tools available in this session (`execute_zapier_write_action`, `create_zapier_skill`, etc.) can run individual actions or save conversational skills, but cannot create a standing, autonomous trigger-based Zap; that requires the Zapier web editor, so build execution was handed to the user with exact configuration steps rather than attempted here.
**Context:** This is explicitly a test/prototype setup (user's words). Trigger and action apps confirmed in-session: Gmail (`GoogleMailV2CLIAPI`) and LeadConnector/GoHighLevel (`HighLevelCLIAPI`, enabled and inspected to confirm exact action keys and parameters).
