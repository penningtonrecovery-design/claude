// Optional Claude wording layer for the AI Administrative Assistant.
// - Only runs if ANTHROPIC_API_KEY is set on the server.
// - Receives ONLY the rules engine's findings text (fictional demo data).
// - Output passes a clinical-advice filter; on any problem we fall back to the rules summary.
// - Has no ability to read or change orders, doses or records.
// PRODUCTION NOTE: sending real resident data to any third-party API requires a BAA,
// data minimisation and a privacy review. This demo sends fictional data only.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { containsClinicalAdvice } from "@/lib/assistant";

export const runtime = "nodejs";

const SYSTEM = `You are the administrative documentation assistant inside MARcheck, a DEMONSTRATION eMAR prototype for small residential care homes. All data is fictional.

Your only job: turn a list of documentation findings (already detected by a rules engine) into a short, plain-language review summary for a care supervisor, explaining where staff may need to look in the records.

Strict rules:
- Talk only about documentation: missing entries, overdue documentation, late entries, unreviewed exceptions, corrections, records that conflict with order status.
- Never give clinical advice. Never say or imply whether any medication should be given, withheld, held, skipped, substituted, restarted, stopped, or have its dose changed. Never comment on a resident's health, symptoms or the appropriateness of a medication.
- Never invent findings, residents, medications or numbers that are not in the input.
- Refer decisions to "qualified staff following the orders on file and facility policy".
- Format: 1 short overview sentence, then up to 6 bullet points grouped by priority (High / Medium / Low), each naming where to look (e.g. Supervisor dashboard, Audit trail, Resident profile). Max 180 words. Plain text with "-" bullets, no markdown headings.`;

export async function GET() {
  return NextResponse.json({ llmAvailable: Boolean(process.env.ANTHROPIC_API_KEY) });
}

interface FindingIn {
  severity: string;
  title: string;
  detail: string;
  whereToLook?: { label: string };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ source: "rules", reason: "ANTHROPIC_API_KEY is not configured" }, { status: 200 });
  }
  let findings: FindingIn[];
  try {
    const body = (await req.json()) as { findings?: FindingIn[] };
    findings = (body.findings ?? []).slice(0, 60).map((f) => ({
      severity: String(f.severity).slice(0, 10),
      title: String(f.title).slice(0, 120),
      detail: String(f.detail).slice(0, 600),
      whereToLook: f.whereToLook ? { label: String(f.whereToLook.label).slice(0, 60) } : undefined,
    }));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (findings.length === 0) return NextResponse.json({ source: "rules", reason: "No findings" });

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Documentation findings from the rules engine (JSON):\n${JSON.stringify(findings, null, 1)}\n\nWrite the supervisor review summary.`,
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ source: "rules", reason: "Model declined; showing rules summary" });
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();
    if (!text) return NextResponse.json({ source: "rules", reason: "Empty model response" });
    if (containsClinicalAdvice(text)) {
      return NextResponse.json({ source: "rules", filtered: true, reason: "Model output was blocked by the clinical-advice guardrail" });
    }
    return NextResponse.json({ source: "claude", summary: text });
  } catch (e) {
    const msg =
      e instanceof Anthropic.AuthenticationError
        ? "API key rejected"
        : e instanceof Anthropic.RateLimitError
          ? "Rate limited"
          : e instanceof Anthropic.APIConnectionError
            ? "Could not reach the API"
            : e instanceof Anthropic.APIError
              ? `API error ${e.status ?? ""}`.trim()
              : "Unexpected error";
    return NextResponse.json({ source: "rules", reason: msg });
  }
}
