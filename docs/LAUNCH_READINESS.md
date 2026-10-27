# Before public launch

Nothing here is done unless it's checked. The app must not be released publicly until
every **Blocker** is resolved.

## Mental-health safety (Blockers)

- [ ] Qualified clinician review of the persona prompt (`src/lib/persona/system-prompt.ts`).
- [ ] Clinician review of the fixed crisis and harm-to-others responses (`src/lib/safety/responses.ts`)
      and the distress/abuse instructions.
- [ ] Clinician review of the growth-plan step library (`src/lib/growth/library.ts`), the
      tailoring instructions (`src/lib/growth/tailor.ts`) and the reflection questions and
      scale labels (`src/lib/growth/reflection.ts`).
- [ ] Re-verify every crisis resource (numbers, hours, wording) in `src/lib/safety/resources.ts`.
- [ ] Evaluate the safety classifier on a reviewed test set, including indirect language,
      slang, sarcasm and past-tense disclosures. Measure misses and over-triggers.
- [ ] Safety handling for **voice** (currently prompt-only; see docs/RETELL_SETUP.md).
- [ ] Red-team the model for unsafe advice, dependency-building, impersonation, and
      pressure to disclose trauma.
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

- [ ] Rate limiting and per-user quotas on chat and voice endpoints.
- [ ] Hosted Supabase: custom SMTP, production redirect URLs, auth rate limits, backups,
      point-in-time recovery decision.
- [ ] Security headers and CSP.
- [ ] Dependency and secret scanning in CI.
- [ ] Verify encryption at rest on the chosen Supabase plan; decide on application-level
      encryption for memory notes.

## Product verification

- [ ] Plan tailoring tested live: output quality, refusals, and that unsafe suggestions are dropped.
- [ ] Text conversation tested live with your OpenAI key and chosen model.
- [ ] Voice tested live with your Retell agent: latency, interruption, pause, end, voice choice.
- [ ] Magic link, password sign-up, confirmation and reset tested end to end against
      local and hosted Supabase.
- [ ] Accessibility pass (keyboard, screen reader, contrast).
