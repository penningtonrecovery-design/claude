import { NextResponse, type NextRequest } from "next/server";
import { getChatProvider } from "@/lib/ai";
import { respond } from "@/lib/chat/respond";
import { chatRequestSchema } from "@/lib/chat/validation";
import { getAiConfig } from "@/lib/config";
import { moderateWithOpenAI } from "@/lib/safety/moderation";
import { getCurrentUser } from "@/lib/supabase/server";

// Text conversation endpoint. Messages are processed in memory and not
// written to the database.
export async function POST(request: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, memory_enabled")
    .eq("id", user.id)
    .maybeSingle();

  let memories: { category: string; content: string }[] = [];
  if (profile?.memory_enabled) {
    const { data } = await supabase
      .from("memories")
      .select("category, content")
      .order("created_at", { ascending: true })
      .limit(50);
    memories = data ?? [];
  }

  const ai = getAiConfig();

  try {
    const outcome = await respond(parsed.data.messages, {
      provider: getChatProvider(),
      moderate: ai ? (text) => moderateWithOpenAI(ai.apiKey, text) : undefined,
      displayName: profile?.display_name,
      memories,
    });

    if (outcome.kind === "not_configured") {
      return NextResponse.json(
        { error: "ai_not_configured", safety: outcome.safety },
        { status: 503 },
      );
    }
    return NextResponse.json({
      reply: outcome.reply,
      safety: outcome.safety,
      source: outcome.source,
    });
  } catch {
    // Never log message content.
    console.error("[chat] model request failed");
    return NextResponse.json({ error: "model_error" }, { status: 502 });
  }
}
