import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AuditRequest, ScorecardResult, SiteSignals } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

const client = new Anthropic();

const CriterionSchema = z.object({
  status: z.enum(["good", "needs_work", "critical"]),
  tip: z
    .string()
    .describe(
      "One specific, plain-English, actionable tip (1-2 sentences) telling the business owner exactly what to fix or confirm. No jargon.",
    ),
});

const ScorecardSchema = z.object({
  overallSummary: z
    .string()
    .describe(
      "2-3 plain-English sentences, written directly to the business owner, naming the single biggest opportunity on their site.",
    ),
  valueProp: CriterionSchema,
  mobileFriendly: CriterionSchema,
  loadSpeed: CriterionSchema,
  clickToCall: CriterionSchema,
  socialProof: CriterionSchema,
  primaryCta: CriterionSchema,
  contactFindability: CriterionSchema,
});

const SYSTEM_PROMPT = `You are the scoring engine behind P&G AI Consulting's free instant website & online-presence audit tool. Small business owners submit their website and get back a traffic-light report card.

You do not receive the raw HTML. You receive a JSON object of signals already extracted from the page (meta tags, headings, link text, counts, a text snippet, and basic timing/size numbers) plus the business's name and city. Score exactly 7 criteria from that evidence:

1. valueProp - Is it clear within the first screen of content what the business does and why to choose them? Judge from the title, meta description, h1s, and the above-the-fold text snippet.
2. mobileFriendly - Is there a proper responsive viewport meta tag (width=device-width)? Missing or malformed viewport meta is a critical mobile problem.
3. loadSpeed - Use fetchMs (server response time), htmlBytes, scriptTagCount, stylesheetCount, and imagesMissingDimensionsCount as a proxy for real-world load speed and layout shift risk. You are not running real Lighthouse - phrase findings as an estimate, never claim an exact score.
4. clickToCall - Does the site expose a tappable phone number for mobile visitors? telLinkCount > 0 is strong evidence of good; a phone number appearing only as plain text (phoneNumberMatchCount > 0 but telLinkCount = 0) is needs_work, not good, because it isn't tappable.
5. socialProof - Are Google reviews, star ratings, testimonials, or links to review platforms visible? Use reviewSignalHits.
6. primaryCta - Is there one obvious next step (e.g. "Call Now", "Book a Quote", "Get Started"), or do ctaTexts show many competing, vague, or duplicate links with no clear priority?
7. contactFindability - Could a visitor find a phone number, email, or address within about 5 seconds? Consider telLinkCount, mailtoLinkCount, phoneNumberMatchCount, footerTextSnippet, and whether navLinkTexts includes something like "Contact".

Scoring rules:
- Use "critical" only for things that actively cost the business leads or customers (e.g. no phone number anywhere, broken/missing viewport, no way to contact them).
- When evidence is missing or ambiguous, score "needs_work" rather than assuming the best case - never give the benefit of the doubt to absent evidence.
- Each tip must be concrete and specific to what you observed (reference actual counts, missing elements, or text you saw) - never generic filler like "improve your website."
- Keep tone professional, encouraging, and non-alarmist - this is a lead magnet for a consulting service, not a scare tactic.
- overallSummary should read as if written by a helpful consultant, naming the business by name.`;

function buildUserMessage(request: AuditRequest, signals: SiteSignals): string {
  return [
    `Business name: ${request.businessName}`,
    `City: ${request.city}`,
    `Submitted URL: ${request.websiteUrl}`,
    "",
    "Extracted site signals (JSON):",
    JSON.stringify(signals, null, 2),
  ].join("\n");
}

export async function scoreSite(
  request: AuditRequest,
  signals: SiteSignals,
): Promise<ScorecardResult> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ScorecardSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(request, signals) }],
  });

  if (!response.parsed_output) {
    throw new Error("The audit model did not return a valid scorecard.");
  }

  return response.parsed_output;
}
