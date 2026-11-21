import { NextResponse, type NextRequest } from "next/server";
import { getChatProvider } from "@/lib/ai";
import { chatRequestSchema } from "@/lib/chat/validation";
import { preferencesFromProfile } from "@/lib/personalization/preferences";
import { suggestPreferences } from "@/lib/personalization/suggest";
import { consumeRateLimit, limitMessage, retryAfterHeader } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";

// Suggests style preferences from the conversation he chose to share. The
// conversation is used for this one request and not stored; nothing is
// changed until he accepts a suggestion.
export async function POST(request: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("pref_tone, pref_focus, pref_next_steps, pref_faith, pref_avoid_topics, life_context")
    .eq("id", user.id)
    .maybeSingle();

  try {
    const outcome = await suggestPreferences(
      parsed.data.messages,
      preferencesFromProfile(profile),
      getChatProvider(),
      () => consumeRateLimit(supabase, "suggest"),
    );
    if (outcome.kind === "not_configured") return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    if (outcome.kind === "rate_limited") {
      return NextResponse.json(
        { error: "rate_limited", message: limitMessage("suggest", outcome.limit) },
        { status: 429, headers: retryAfterHeader(outcome.limit) },
      );
    }
    return NextResponse.json(outcome);
  } catch {
    console.error("[preferences] suggestion request failed");
    return NextResponse.json({ error: "model_error" }, { status: 502 });
  }
}
