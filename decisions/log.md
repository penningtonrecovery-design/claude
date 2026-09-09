# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-09-09 — Emperor Supply homepage redesign: scope, stack, content, and style
**Decision:** Build a single, self-contained homepage (`index.html` + `css/style.css` + `js/script.js`, no build step) as a "look like it cost $10,000" redesign concept for emperorsupply.com, rather than a full multi-page rebuild or a non-code mockup. Use placeholder copy and imagery grounded in publicly known facts about Emperor Supply Inc. (est. 1983; CA electrical/plumbing/HVAC/lighting/building-materials distributor; 7 California locations; carries brands like Kohler, Grohe, Toto, American Standard, Rheem, Lutron, Panasonic, Cutler-Hammer, Bryant, Murray) rather than real assets from the client. Visual direction: clean modern corporate (whitespace, confident primary brand color, crisp sans-serif type, large hero, subtle motion) rather than bold-industrial or premium-dark. Avoided fabricating specific real-looking contact details (phone numbers, emails, exact branch addresses beyond the one publicly listed Oakland location) to prevent placeholder content from being mistaken for real business information.
**Reasoning:** The repo had no existing site code to redesign in place, and emperorsupply.com could not be fetched directly (network egress blocked), so scope/stack/content/style were all open decisions requiring user input before any code could be written, per the 95%-confidence rule. Plain static HTML/CSS/JS was chosen for zero build tooling and maximum portability/handoff ease. A single homepage was chosen as the fastest path to a visible, high-impact result the user can evaluate before committing to a full site rebuild.
**Context:** Decided via one-at-a-time clarifying questions (scope, tech stack, content/assets source, visual style) at the start of the redesign task, per this repo's standing rules.
