import type { ChatMessage, ChatProvider } from "@/lib/ai/types";
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
  | { kind: "not_configured"; safety: SafetyLevel };

export type RespondDeps = {
  provider: ChatProvider | null;
  moderate?: (text: string) => Promise<SafetyResult | null>;
  displayName?: string | null;
  memories?: { category: string; content: string }[];
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

  const system = buildSystemPrompt({
    displayName: deps.displayName,
    memories: deps.memories,
    safetyInstructions: safetyInstructions(safety.level),
  });

  const reply = await deps.provider.generate({ system, messages });
  return { kind: "reply", reply, safety: safety.level, source: "model" };
}
