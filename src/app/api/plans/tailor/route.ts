import { NextResponse, type NextRequest } from "next/server";
import { getChatProvider } from "@/lib/ai";
import { getAiConfig } from "@/lib/config";
import { tailorSteps } from "@/lib/growth/tailor";
import { tailorRequestSchema } from "@/lib/growth/schemas";
import { moderateWithOpenAI } from "@/lib/safety/moderation";
import { getCurrentUser } from "@/lib/supabase/server";

// Suggests plan steps tailored to what he wants to work on. Nothing is saved
// here; he reviews and edits the steps before creating the plan.
export async function POST(request: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = tailorRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const ai = getAiConfig();
  try {
    const outcome = await tailorSteps(parsed.data.topic, parsed.data.focus, {
      provider: getChatProvider(),
      moderate: ai ? (text) => moderateWithOpenAI(ai.apiKey, text) : undefined,
    });
    switch (outcome.kind) {
      case "steps":
        return NextResponse.json({ steps: outcome.steps });
      case "crisis":
        return NextResponse.json({ error: "crisis", safety: "crisis" }, { status: 200 });
      case "not_configured":
        return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
      case "unusable":
        return NextResponse.json({ error: "unusable" }, { status: 502 });
    }
  } catch {
    console.error("[plans] tailoring request failed");
    return NextResponse.json({ error: "model_error" }, { status: 502 });
  }
}
