# Before public launch

Nothing here is done unless it's checked. The app must not be released publicly until
every **Blocker** is resolved.

## Mental-health safety (Blockers)

- [ ] Qualified clinician review of the persona prompt (`src/lib/persona/system-prompt.ts`).
- [ ] Clinician review of the fixed crisis and harm-to-others responses (`src/lib/safety/responses.ts`)
      and the distress/abuse instructions.
- [ ] Clinician review of the growth-plan step library (`src/lib/growth/library.ts`), the
      tailoring instructions (`src/lib/growth/tailor.ts`) and the reflection questions and
      scale labels (`src/lib/growth/reflection.ts`), and the check-in notes (`src/lib/checkins.ts`).
- [ ] Clinician review of the knowledge-base entries and verification of every citation
      (`docs/knowledge/REVIEW.md`); verify or drop the brief's unconfirmed sources.
- [ ] Clinician review of the preference wording (`src/lib/personalization/preferences.ts`)
      and the suggestion instructions (`src/lib/personalization/suggest.ts`).
- [ ] Re-verify every crisis resource (numbers, hours, wording) in `src/lib/safety/resources.ts`.
- [x] Build a labelled test set and scorecard for the safety screen (`docs/safety/`).
- [ ] Clinician review of the test set labels (`src/lib/safety/eval/cases.ts`).
- [ ] Decide on a model-based risk check: the keyword screen caught only 1–4 of 20 fresh
      indirect crisis messages (see `docs/safety/README.md`).
- [ ] Run `npm run redteam` with the production model and review every fail/concern.
- [ ] Safety handling for **voice** (currently prompt-only; see docs/RETELL_SETUP.md).
- [x] Red-team script for unsafe advice, dependency, impersonation, trauma pressure (`npm run redteam`).
- [ ] Decide escalation policy for abuse disclosures involving children (mandatory-reporting
      questions are legal, not technical).
- [ ] Professional review of the psychological knowledge base before it is used. Verify
      bibliographic details for "Sons of the Father" and the identity of "The Fatherless
      Project" before citing either.

## Privacy and legal (Blockers)

- [ ] Privacy policy and terms of service drafted and reviewed by a lawyer.
- [ ] Configure Retell data storage; update the privacy page with exact retention.
- [ ] Data processing agreements with Supabase, OpenAI, Retell, Vercel as needed.
- [ ] Review state privacy laws on health-adjacent data (e.g. Washington My Health My
      Data Act) and FTC Health Breach Notification Rule applicability.
- [ ] Age gate: decide whether self-attestation (current) is enough.
- [ ] Marketing and in-app wording reviewed so nothing implies therapy, diagnosis, or
      complete confidentiality.

## Security (Blockers)

- [x] Rate limiting and per-user quotas on chat, voice, tailoring, suggestions, uploads and
      exports (`consume_rate_limit`; limits in docs/SECURITY_AND_PRIVACY.md).
- [ ] Set the 30-minute maximum call duration on the Retell agent (docs/RETELL_SETUP.md).
- [ ] Set monthly spending caps in the OpenAI and Retell dashboards.
- [ ] Hosted Supabase: custom SMTP, production redirect URLs, auth rate limits, backups,
      point-in-time recovery decision.
- [ ] Security headers and CSP (allow the Supabase Storage host for keepsake images).
- [ ] Confirm the image generator's terms allow commercial use of the grandfather portraits
      (`public/companions/`, made with ElevenLabs), and keep a record of how they were made.
- [ ] Decide whether keepsake uploads need automated content screening (they are visible only
      to the uploader today).
- [ ] Dependency and secret scanning in CI.
- [ ] Verify encryption at rest on the chosen Supabase plan; decide on application-level
      encryption for memory notes.

## Product verification

- [ ] Plan tailoring tested live: output quality, refusals, and that unsafe suggestions are dropped.
- [ ] Text conversation tested live with your OpenAI key and chosen model.
- [ ] Voice tested live with your Retell agent: latency, interruption, pause, end, voice choice.
- [ ] Magic link, password sign-up, confirmation and reset tested end to end against
      local and hosted Supabase.
- [ ] Keepsake photo upload, display and deletion tested against real Supabase Storage
      (local and hosted), including large phone photos and HEIC files from iPhones.
- [ ] Accessibility pass (keyboard, screen reader, contrast).
