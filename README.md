# P&G AI Consulting - Free Website & Online-Presence Audit

A lead-magnet web app: a visitor enters their business name, website URL, and city, and
gets back an instant, AI-generated traffic-light scorecard of their site across 7 criteria
(value prop, mobile-friendliness, load speed, click-to-call, social proof, primary CTA,
and contact findability). Each scored item includes a plain-English tip. The report ends
with a "Book a free 15-minute call" lead-capture form.

Built with Next.js (App Router) + TypeScript + Tailwind CSS, deployed to Vercel.

## How it works

1. The visitor submits the form on the homepage.
2. `POST /api/audit` fetches the submitted URL server-side (`lib/scrape.ts`), parses the
   HTML with Cheerio, and extracts a set of signals (meta tags, headings, link text,
   phone/CTA/review indicators, response time, page weight, etc.) - this is the
   "Lighthouse-style" load-speed proxy; it's a heuristic, not a real Lighthouse run.
3. Those signals are sent to the Claude API (`lib/anthropic.ts`), which returns a
   structured JSON scorecard (one status + one tip per criterion) using the SDK's
   structured-outputs feature, so the shape is always valid.
4. The report renders as a traffic-light report card (`components/ReportCard.tsx`).
5. If the visitor books a call, `POST /api/lead` appends their name/email/business to a
   Google Sheet (`lib/sheets.ts`) - there's no database in this MVP.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Open http://localhost:3000.

## Required environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key used to score each audit. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-opus-5`. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email with edit access to the leads sheet. |
| `GOOGLE_PRIVATE_KEY` | Service account private key (from the downloaded JSON key file). |
| `GOOGLE_SHEET_ID` | The spreadsheet ID (from its URL) that leads get appended to. |

See `.env.example` for the exact format.

### Setting up the Google Sheet

1. Create a Google Sheet. Add a first row/tab named `Leads` with header columns:
   `Timestamp | Name | Email | Business | City | Audited URL`.
2. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or use
   an existing one), enable the **Google Sheets API**, then create a **Service Account**.
3. Create a JSON key for that service account and download it. From the JSON, copy the
   `client_email` value into `GOOGLE_SERVICE_ACCOUNT_EMAIL` and the `private_key` value
   (keep the `\n` sequences) into `GOOGLE_PRIVATE_KEY`.
4. Open your Google Sheet, click **Share**, and give the service account's email
   **Editor** access.
5. Copy the spreadsheet ID out of its URL
   (`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`) into `GOOGLE_SHEET_ID`.

### Getting a Claude API key

Create a key at [console.anthropic.com](https://console.anthropic.com/settings/keys).

## Deploying to Vercel

1. Push this repository to GitHub (or connect it directly).
2. In the [Vercel dashboard](https://vercel.com/new), import the repository - it's
   auto-detected as a Next.js app, no build config needed.
3. Under **Settings > Environment Variables**, add the four variables listed above.
4. Deploy. Every subsequent push to the connected branch redeploys automatically.

Note: the audit endpoint (`app/api/audit/route.ts`) is configured with
`maxDuration = 60` seconds to give the fetch + LLM call room to complete. Vercel's Hobby
plan may cap function duration lower than that - if audits are timing out in production,
either upgrade the plan or reduce this value alongside tightening the fetch timeout in
`lib/scrape.ts`.

## Known limitations (MVP scope)

- **No live scheduling** - the "Book a free 15-min call" CTA only captures lead info; it
  doesn't book a real calendar slot.
- **No lead-notification email** - leads land in the Google Sheet only; check it manually
  or wire up a notification (e.g. a Sheet-triggered Apps Script, or swap in an email
  provider) later.
- **No abuse rate-limiting** - each submission fetches an arbitrary URL and calls the
  Claude API, which costs money per request. There's a basic SSRF guard (blocks
  loopback/private/link-local hosts) and fetch timeouts/size caps, but nothing yet stops
  someone from submitting the same URL repeatedly. Add a rate limiter (e.g. Vercel
  Firewall rules or an Upstash-backed limiter) before high-traffic launch.
- **Load speed is a proxy, not real Lighthouse** - it's derived from response time, page
  weight, and resource counts, not an actual Core Web Vitals run.
- **Placeholder business contact info** - the footer on the page itself ships with
  `[phone]` / `[business email]` placeholders (see `app/page.tsx`); swap in real contact
  details before launch.
