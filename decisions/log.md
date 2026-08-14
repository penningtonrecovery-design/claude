# Decision Log

## 2026-08-14 — Require 95% confidence before making changes
**Decision:** Claude must not make changes until it has 95% confidence in what needs to be built, and must ask follow-up questions one at a time until reaching that confidence level. Codified in CLAUDE.md.
**Reasoning:** Prevent premature or misdirected work by forcing clarification up front rather than iterating after the fact.
**Context:** Added as the first standing rule in CLAUDE.md for this repo.

## 2026-08-14 — Log architectural/strategic decisions to decisions/log.md
**Decision:** Whenever a meaningful architectural or strategic decision is made, record it in `decisions/log.md` with the date, the decision, the reasoning, and the context. This log captures decisions, not conversations.
**Reasoning:** Keep a durable, scannable record of why choices were made, separate from chat history, so future work can reference intent without digging through past sessions.
**Context:** Added as the second standing rule in CLAUDE.md, alongside the confidence-threshold rule.

## 2026-08-14 — P&G AI Consulting one-page site: positioning and scope
**Decision:** Build a one-page site for P&G AI Consulting positioned as a hands-on custom AI/automation implementation shop (not general strategy consulting or a fractional-advisor retainer), targeting Dallas, TX home service trades (HVAC, plumbing, electrical, landscaping). Tone: warm, approachable, trustworthy.
**Reasoning:** Clarified directly with the business owner via one-at-a-time follow-up questions per CLAUDE.md's confidence-threshold rule. This vertical/geo focus lets the hero promise, benefit outcomes, and testimonials be specific rather than generic.
**Context:** No design.md existed in the repo, so positioning had to be established from scratch before writing copy or choosing a palette.

## 2026-08-14 — Visual system: sky blue accent on warm neutrals, no design.md yet
**Decision:** Palette is a single sky-blue accent on warm off-white/charcoal neutrals (no design.md exists yet to source from). Display font paired with a body font via Google Fonts, chosen for a warm/trustworthy feel rather than a generic tech look.
**Reasoning:** User chose "sky blue" when offered palette directions; explicit project requirement was one accent + neutrals, avoiding the generic purple-to-blue AI gradient look.
**Context:** Should a design.md be created later, this palette should be reconciled with it rather than treated as the permanent brand system.

## 2026-08-14 — Quote form uses a temporary mailto action
**Decision:** The "Get a quote" form submits via a `mailto:penningtonrecovery@gmail.com` action (enctype=text/plain) rather than a real form backend, since the deliverable is a single self-contained static HTML file with no server.
**Reasoning:** User explicitly confirmed this is a known-temporary approach, to be replaced with a real form backend (e.g. Formspree/Netlify Forms) in a later step.
**Context:** Flagged so a future session doesn't mistake the mailto action for the final intended form handling.

## 2026-08-14 — Site hosted on GitHub Pages via Actions, auto-deploying from this branch
**Decision:** The site is hosted at `https://penningtonrecovery-design.github.io/claude/`, deployed by `.github/workflows/deploy-pages.yml`. The workflow copies only `index.html` into a `_site` staging directory (keeping `CLAUDE.md` and `decisions/log.md` off the public site) and deploys it via `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`. It triggers on every push to `claude/pg-ai-consulting-site-q1qwwb`, so no manual redeploy step is needed going forward.
**Reasoning:** User explicitly chose GitHub for hosting ("let's go with GitHub"). The repo is public, so Pages hosting is free.
**Context:** First-time setup required three manual one-time changes in repo Settings that no API token (including admin-scoped ones) is allowed to make on a user's behalf — each was diagnosed from an actual failed deploy, not guessed upfront:
1. **Settings → Pages → Source** = "GitHub Actions" (was unset; the default Actions token can deploy to an existing Pages site but cannot create one from scratch — `enablement: true` on `configure-pages` does not bypass this).
2. **Settings → Actions → General → Workflow permissions** = "Read and write permissions" (was read-only, which silently caps the token below what the workflow's `permissions:` block requests).
3. **Settings → Environments → github-pages → Deployment branches** = allow `claude/pg-ai-consulting-site-q1qwwb` (the auto-created `github-pages` environment defaults to only allowing the repo's default branch, which here is `claude/claude-md-confidence-rule-9kea8a`, not this branch).
Only after all three were set did a deploy run (`run #8`, id `31845948025`) succeed. If the site ever goes dark after a settings change or repo transfer, re-check these three first.
