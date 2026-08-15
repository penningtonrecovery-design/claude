# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-08-15 — Social media workflow: one idea → all platforms, with approval gate
**Decision:** The n8n social media workflow follows a "one idea → all platforms" design: a single content idea (submitted via an n8n Form) is rewritten by AI into platform-native posts for Facebook, Instagram, LinkedIn, and X, then held for email approval before publishing. Stan Store is integrated as a CTA link in the post copy (not a publishing target), since Stan Store has no posting API. The workflow prompt lives in `prompts/n8n-social-media-workflow-prompt.md`.
**Reasoning:** One input driving all channels minimizes daily effort while keeping each post platform-appropriate. A review-before-posting gate was chosen over full automation to protect brand voice for a recovery-focused business, where tone and avoiding medical claims matter. Publishing branches run independently with continue-on-error so one platform failure doesn't block the rest.
**Context:** User is building their social media automation in n8n and asked for a ready-to-paste builder prompt. Instagram requires an image and a Business account; X is capped at 280 characters; the approval email goes to the owner's Gmail.
