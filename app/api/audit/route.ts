import { z } from "zod";
import { scoreSite } from "@/lib/anthropic";
import { AuditFetchError, fetchAndAnalyze } from "@/lib/scrape";
import type { AuditResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required.").max(200),
  websiteUrl: z.string().trim().min(1, "Website URL is required.").max(2000),
  city: z.string().trim().min(1, "City is required.").max(200),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { businessName, websiteUrl, city } = parsed.data;

  try {
    const signals = await fetchAndAnalyze(websiteUrl);
    const scorecard = await scoreSite({ businessName, websiteUrl, city }, signals);

    const result: AuditResponse = {
      businessName,
      city,
      auditedUrl: signals.finalUrl,
      scorecard,
    };
    return Response.json(result);
  } catch (err) {
    if (err instanceof AuditFetchError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    console.error("Audit failed:", err);
    return Response.json(
      { error: "Something went wrong while auditing that site. Please try again." },
      { status: 500 },
    );
  }
}
