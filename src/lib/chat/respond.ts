import type { ChatMessage, ChatProvider } from "@/lib/ai/types";
import { renderKnowledge, selectKnowledge } from "@/lib/knowledge/select";
import type { RateLimitResult } from "@/lib/rate-limit";
import type { KnowledgeEntry } from "@/lib/knowledge/types";
import { buildSystemPrompt } from "@/lib/persona/system-prompt";
import {
  classifyMessage,
  mergeResults,
  type SafetyLevel,
  type SafetyResult,
} from "@/lib/safety/classifier";
import {
  CRISIS_RESPONSE,
  HARM_TO_OTHERS_RESPONSE,
  safetyInstructions,
} from "@/lib/safety/responses";

export type ChatOutcome =
  | { kind: "reply"; reply: string; safety: SafetyLevel; source: "model" | "safety" }
  | { kind: "not_configured"; safety: SafetyLevel }
  | { kind: "rate_limited"; safety: SafetyLevel; limit: Extract<RateLimitResult, { allowed: false }> };

export type RespondDeps = {
  provider: ChatProvider | null;
  moderate?: (text: string) => Promise<SafetyResult | null>;
  displayName?: string | null;
  memories?: { category: string; content: string }[];
  plans?: { topic: string; focus: string | null; openSteps: string[] }[];
  preferences?: string | null;
  // Defaults to the approved entries in the repository's knowledge base.
  knowledgeEntries?: KnowledgeEntry[];
  // Counts one model reply against his limits. Called only after screening,
  // so a crisis message is always answered, even over the limit.
  checkLimit?: () => Promise<RateLimitResult>;
};

// Screens the latest message, then either returns a fixed crisis response or
// asks the language model for a reply. Crisis handling never depends on the
// model, and works even when no model is configured.
export async function respond(
  messages: ChatMessage[],
  deps: RespondDeps,
): Promise<ChatOutcome> {
  const latest = messages[messages.length - 1].content;

  let safety = classifyMessage(latest);
  if (deps.moderate && safety.level !== "crisis") {
    const moderated = await deps.moderate(latest);
    if (moderated) safety = mergeResults(safety, moderated);
  }

  if (safety.level === "crisis") {
    const reply = safety.categories.includes("harm_to_others") &&
      !safety.categories.includes("suicide") &&
      !safety.categories.includes("self_harm")
      ? HARM_TO_OTHERS_RESPONSE
      : CRISIS_RESPONSE;
    return { kind: "reply", reply, safety: "crisis", source: "safety" };
  }

  if (!deps.provider) {
    return { kind: "not_configured", safety: safety.level };
  }

  if (deps.checkLimit) {
    const limit = await deps.checkLimit();
    if (!limit.allowed) return { kind: "rate_limited", safety: safety.level, limit };
  }

  const system = buildSystemPrompt({
    displayName: deps.displayName,
    memories: deps.memories,
    plans: deps.plans,
    preferences: deps.preferences,
    knowledge: renderKnowledge(
      selectKnowledge(
        messages.filter((m) => m.role === "user").slice(-3).map((m) => m.content),
        deps.knowledgeEntries,
      ),
    ),
    safetyInstructions: safetyInstructions(safety.level),
  });

  const reply = await deps.provider.generate({ system, messages });
  return { kind: "reply", reply, safety: safety.level, source: "model" };
}
