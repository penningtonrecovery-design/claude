# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-10-11 — Store reusable skills in `.claude/skills/` (first: system-mapper)
**Decision:** Project skills live in `.claude/skills/<skill-name>/SKILL.md`, checked into this repo. The first one added is `system-mapper`, which turns a workflow description into an interactive HTML/SVG diagram plus bottleneck analysis and optimization suggestions.
**Reasoning:** That path is where Claude Code auto-discovers project skills, so any session in this repo can use them with no extra setup, and they are version-controlled alongside the decision log.
**Context:** The user supplied the system-mapper skill definition and chose to save it as a repo skill (not run it immediately). It is stored verbatim; its `triggers` frontmatter list is not a field Claude Code reads (triggering comes from `description`), but it is kept as harmless documentation.
