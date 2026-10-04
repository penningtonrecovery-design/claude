# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-10-04 — Landing page built as a single self-contained HTML file
**Decision:** The SaaS analytics landing page lives in one `index.html` at the repo root, with inline CSS/JS, inline SVG icons and charts, and no build step or framework. Only Google Fonts is loaded externally.
**Reasoning:** It opens in any browser with no tooling and is easy to preview and share. It can be ported to a component framework later if the site grows.
**Context:** The user picked this over Vite+React, Next.js and multi-file plain HTML.

## 2026-10-04 — Placeholder brand, dark glass theme, 3-tier pricing
**Decision:** Use a placeholder brand ("Lumen Analytics") with a single dark theme: a deep navy background lit by teal and amber glows behind frosted-glass cards. Pricing has three tiers (Starter $29, Growth $79 marked most popular, Enterprise custom) with a monthly/yearly toggle at 20% off yearly. The hero dashboard shows simulated live data, and customer logos are invented placeholders.
**Reasoning:** Glassmorphism reads best on a dark background and suits an analytics product. All brand values sit in `:root` tokens so they are easy to swap when real branding exists.
**Context:** The user chose an invented placeholder brand, a dark theme and the recommended pricing structure.
