# Marcheck — eMAR demonstration prototype

> **DEMO ONLY — NOT FOR CLINICAL USE.**
> Marcheck is a market-validation prototype. Every resident, staff member, medication order and record is fictional. It is **not** HIPAA-compliant, FDA-cleared, clinically validated or certified in any way. Do not enter real patient information, and do not use it to administer or document real medication.

Marcheck is an electronic Medication Administration Record (eMAR) for small residential care homes (about 4–16 residents). It shows how caregivers document doses, how supervisors catch gaps and exceptions, and how administrators set up a home. It runs entirely in the browser using fictional seed data, with no accounts, database or API keys needed.

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open **http://localhost:3000** and pick a fictional staff member on the sign-in screen.

For a production build:

```bash
npm run build && npm start
```

Other scripts:

```bash
npm test
```

| Script | What it does |
| --- | --- |
| `npm test` | Vitest unit tests for dose statuses, documentation rules, corrections, the audit chain, the assistant and reports |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, with no emit |

To open the app from a tablet or phone on the same network, run `npm run dev -- -H 0.0.0.0` and browse to `http://<your-computer-ip>:3000`.

### Hosted single-file demo

```bash
npm run build:static
```

This bundles the same pages into one self-contained file, `dist-static/marcheck.html`, with all JavaScript and CSS inline and no server needed. It was used to publish the shareable demo link. The hosted version differs from the full app in three ways, all because the page runs in a locked-down frame:

- It can't open the print dialog, so the Print button is hidden.
- It can't download files, so the audit export copies CSV to the clipboard instead.
- It can't call APIs, so the AI assistant always runs in offline rules mode.

Everything else, including sign-in, role switching and all workflows, is the same code.

### Optional: Claude wording for the AI assistant

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Without a key, the assistant runs in offline rules mode, and the demo is complete either way.

## Demo script (about 5 minutes)

1. **Sign in as Maria Santos (Caregiver).** The med pass groups today's doses by time. Badges show *Pending*, *Due now*, *Overdue*, *Documented* or *Exception*, each with an icon and text, so status never depends on color alone.
2. **Tap an overdue or due medication.** Review the resident, allergies and the order on file, then choose **Document this dose**.
   - No outcome is pre-selected. Choose Administered, Refused, Held or Not administered.
   - Any outcome other than Administered requires a reason.
   - On the confirmation screen, tick the attestation checkbox before **Save demo record** becomes active.
3. **Switch to Linda Chen (Supervisor)** using the menu in the header. The supervisor dashboard shows:
   - overdue doses today
   - missing documentation from earlier days
   - exceptions waiting for review

   **Remind caregiver** sends a simulated in-app reminder. **Review / escalate** records an acknowledgement or a simulated escalation.
4. **Audit trail.** Every action appears with who did it and when. **Verify chain** recomputes the hash chain. Export to CSV or JSON.
5. **Reports.** Daily summary, Missed & refused, and Completeness. **Print / save as PDF** produces an inspection-style printout labelled as demo data.
6. **AI assistant.** Lists documentation findings by priority with a "where to look" link, and can generate a plain-language handover summary.
7. **Switch to David Brooks (Administrator).** Add a resident, a staff account or a mock medication order, or discontinue an order. **Onboarding** tracks progress through these steps automatically from the audit trail.
8. **Admin → Facility & demo → Reset demo data** restores fresh fictional data anchored to the current time.

## Features vs. the brief

| Area | What's implemented |
| --- | --- |
| Caregiver dashboard | Assigned residents only, doses grouped by time, filters for status and resident, a Today/Yesterday toggle, and one tap to open a dose |
| Resident profiles | Avatar, room, age, allergies, care note, today's schedule, active orders, discontinued orders (struck through and greyed), and 6 days of history including corrections |
| Documentation | Administered, refused, held or not administered; required reasons; optional notes; an explicit attestation checkbox; simulated staff identity; automatic timestamps; nothing ever auto-marked as administered |
| Corrections | Saved as a new record that supersedes the old one with a required reason. The original is never edited and stays visible as "Superseded". Caregivers can correct only their own records. |
| Supervisor | Overdue and missing documentation, exceptions needing review, acknowledge/escalate with a required note, simulated reminders and escalations, and a notification bell |
| Audit trail | Append-only events with actor, role, time and summary; hash chain verification; CSV/JSON export marked as a prototype |
| Reports | Daily medication administration summary, missed/refused report, completeness by day, shift, resident and staff; print stylesheet |
| AI assistant | Rules engine for missing or overdue documentation, unreviewed exceptions, exceptions with no note, late entries, records against discontinued orders, corrections made more than 24 hours later, and repeated exceptions. Optional Claude rewording passes through a clinical-advice filter. |
| Administration | Add, edit and discharge residents; add, edit and deactivate staff and change roles and assignments; add mock orders, change times, discontinue orders; facility settings; onboarding checklist |

## Architecture

```
src/
  lib/                 framework-free domain logic (unit-tested)
    types.ts           DemoState, Resident, MedicationOrder, AdministrationRecord, AuditEvent…
    doses.ts           derives scheduled doses from orders and computes status
    actions.ts         pure state transitions with role checks; each appends an audit event
    audit.ts           append helper, demo hash chain, verification, CSV export
    assistant.ts       rules engine + clinical-advice guard
    reports.ts         daily / exceptions / completeness aggregations
    seed.ts            fictional residents, staff, orders, and 3 days of simulated history
    store.tsx          React context; persists DemoState to localStorage
  components/          AppShell (banner, nav, role switcher, notifications), DoseDialog, UI kit
  spa/                 static single-file build: tiny router + next/link & next/navigation shims
  app/                 Next.js App Router pages + /api/assistant route
scripts/build-static.mjs  esbuild + Tailwind CLI → dist-static/marcheck.html
supabase/schema.sql    sketch of the future Postgres/Supabase schema (not used by the demo)
tests/domain.test.ts   Vitest suite
decisions/log.md       architectural decision log
```

- **Doses are derived, not stored.** Each active order plus its scheduled times produces dose instances, each with a stable ID (`orderId@YYYY-MM-DDTHH:MM`). After an order is discontinued, it stops producing doses.
- **Status rules:**
  - An administered record makes the dose *Documented*.
  - A refused, held or not-administered record makes it an *Exception*.
  - With no record, the dose is *Overdue* once the documentation window (60 minutes by default, configurable) has passed. Before that it is *Pending*, with *Due now* inside the window.
- **Every change goes through `actions.ts`.** Each transition validates the role and inputs, returns new state, and appends an audit event. The UI cannot write state any other way. The AI assistant only reads data.
- **Stack:** Next.js 15, React 19, TypeScript and Tailwind CSS v4. Icons from lucide-react; dialogs are native `<dialog>` elements, which manage focus and Escape handling for accessibility.

## Known limitations

- **Single browser, single device.** Data lives in `localStorage`. Two tablets do not share data, and clearing site data erases everything.
- **Simulated identity.** Anyone can pick any user. Role checks run in the browser and could be bypassed.
- **Demo hash.** The audit hash is non-cryptographic FNV-1a, computed on the client. It shows the concept but proves nothing.
- **Client clock.** Times come from the device clock, which a user can change.
- **Basic schedules only.** No PRN (as-needed) doses, no tapering or weekly schedules, no barcode scanning, no vitals capture, no controlled-substance counts, no pharmacy or EHR integration.
- **Simulated notifications.** Nothing leaves the app: no SMS, email or pager messages.
- **No accessibility audit.** The UI was built with large type, contrast and keyboard access in mind, but has not been formally audited (for example against WCAG 2.2 AA).
- **Real drug names in fictional orders.** Seed orders use common real drug names so the demo looks realistic. They are not clinical guidance.

## Before any real-world deployment

This prototype must **not** be deployed for real medication administration. A production system would need, at minimum:

1. **Authentication.** Real identity (for example Supabase Auth or OIDC/SAML), MFA for admins, per-user credentials, session timeouts, PIN or badge re-authentication at the point of care, and account lifecycle management.
2. **Server-side authorization.** Role and assignment checks enforced on the server and in the database (Postgres RLS), never only in the UI. Least privilege throughout.
3. **Tenant isolation.** Every row scoped to a facility, with isolation tested automatically (see `supabase/schema.sql`).
4. **Encryption.** TLS everywhere, encryption at rest, managed keys with rotation, and no PHI in logs or analytics.
5. **Audit integrity.** Server-generated timestamps from a synchronized clock; SHA-256 hash chaining or a write-once/WORM ledger; database-level append-only grants; periodic independent verification; documented retention.
6. **Backup and recovery.** Automated, encrypted, tested backups; point-in-time recovery; defined RPO and RTO; offline or downtime procedures, including a paper MAR fallback.
7. **Security testing.** Threat modelling, SAST/DAST, dependency scanning, penetration testing, a vulnerability disclosure process and incident response.
8. **Regulatory and legal review.** HIPAA Security and Privacy Rule analysis, BAAs with every vendor that touches PHI (hosting, database, any AI provider), state assisted-living and residential-care regulations, e-signature requirements, and a determination of whether any feature counts as medical device software.
9. **Clinical safety.** Clinical safety review and hazard log, validation of order entry and transcription workflows (ideally integrated with prescriber and pharmacy systems rather than typed in by hand), PRN and controlled-substance workflows, allergy and interaction checking from a validated drug database, and user acceptance testing with caregivers.
10. **AI governance.** Keep the assistant administrative only. Minimize and de-identify data sent to any model, keep a BAA in place, log prompts and outputs for review, test the guardrails continuously, and never let AI change orders or doses.
11. **Operations.** Monitoring, alerting, uptime targets, support processes, change management and staff training.

## Decision log

Architectural and strategic decisions are recorded in [`decisions/log.md`](decisions/log.md).
