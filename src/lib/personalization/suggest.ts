import { z } from "zod";
import type { ChatMessage, ChatProvider } from "@/lib/ai/types";
import type { RateLimitResult } from "@/lib/rate-limit";
import { classifyMessage } from "@/lib/safety/classifier";
import {
  AVOID_TOPICS,
  FOCUSES,
  LABELS,
  NEXT_STEP_FREQUENCIES,
  TONES,
  type AvoidTopic,
  type Preferences,
} from "./preferences";

// Suggestions he can accept or skip, inferred from one conversation he chose
// to share. Only style fields can be suggested: never faith or life context.

export const MIN_USER_MESSAGES = 4;
export const MAX_SUGGESTIONS = 3;

export type Suggestion =
  | { field: "tone"; value: Preferences["tone"]; reason: string }
  | { field: "focus"; value: Preferences["focus"]; reason: string }
  | { field: "nextSteps"; value: Preferences["nextSteps"]; reason: string }
  | { field: "avoidTopic"; value: AvoidTopic; reason: string };

const suggestionSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("tone"), value: z.enum(TONES), reason: z.string().trim().min(1).max(160) }),
  z.object({ field: z.literal("focus"), value: z.enum(FOCUSES), reason: z.string().trim().min(1).max(160) }),
  z.object({ field: z.literal("nextSteps"), value: z.enum(NEXT_STEP_FREQUENCIES), reason: z.string().trim().min(1).max(160) }),
  z.object({ field: z.literal("avoidTopic"), value: z.enum(AVOID_TOPICS), reason: z.string().trim().min(1).max(160) }),
]);

export type SuggestOutcome =
  | { kind: "suggestions"; suggestions: Suggestion[] }
  | { kind: "too_short" }
  | { kind: "not_now" }
  | { kind: "not_configured" }
  | { kind: "rate_limited"; limit: Extract<RateLimitResult, { allowed: false }> };

export const SUGGEST_INSTRUCTIONS = `You help an AI companion called Fatherly Friend adjust its conversational style to suit one man.
Read the conversation and suggest at most ${MAX_SUGGESTIONS} changes to his style preferences, only where the conversation gives clear evidence. Suggest nothing if unsure.
Allowed fields and values:
- tone: ${TONES.join(", ")}
- focus: ${FOCUSES.join(", ")}
- nextSteps: ${NEXT_STEP_FREQUENCIES.join(", ")}
- avoidTopic: ${AVOID_TOPICS.join(", ")} (only if he clearly said he does not want to discuss it)
Never infer or mention diagnoses, faith, relationship status or other personal details.
Each reason is one short, kind sentence addressed to him, e.g. "You said you'd rather get to the point."
Reply with JSON only: {"suggestions": [{"field": "...", "value": "...", "reason": "..."}]}`;

export function parseSuggestions(raw: string, current: Preferences): Suggestion[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  const list = (data as { suggestions?: unknown })?.suggestions;
  if (!Array.isArray(list)) return [];

  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const item of list) {
    const parsed = suggestionSchema.safeParse(item);
    if (!parsed.success) continue;
    const s = parsed.data;
    // Skip anything that wouldn't change his settings, and duplicates.
    const unchanged =
      (s.field === "tone" && current.tone === s.value) ||
      (s.field === "focus" && current.focus === s.value) ||
      (s.field === "nextSteps" && current.nextSteps === s.value) ||
      (s.field === "avoidTopic" && current.avoidTopics.includes(s.value));
    const key = `${s.field}:${s.value}`;
    if (unchanged || seen.has(key) || (s.field !== "avoidTopic" && [...seen].some((k) => k.startsWith(`${s.field}:`)))) continue;
    // A reason is shown to him; screen it like any model text.
    if (classifyMessage(s.reason).level !== "none") continue;
    seen.add(key);
    out.push(s);
    if (out.length === MAX_SUGGESTIONS) break;
  }
  return out;
}

export async function suggestPreferences(
  messages: ChatMessage[],
  current: Preferences,
  provider: ChatProvider | null,
  // Counts one model request; called only once the conversation is screened.
  checkLimit?: () => Promise<RateLimitResult>,
): Promise<SuggestOutcome> {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < MIN_USER_MESSAGES) return { kind: "too_short" };
  // Style tuning is the wrong moment if anything he said signals risk.
  if (userMessages.some((m) => classifyMessage(m.content).level !== "none")) return { kind: "not_now" };
  if (!provider) return { kind: "not_configured" };
  if (checkLimit) {
    const limit = await checkLimit();
    if (!limit.allowed) return { kind: "rate_limited", limit };
  }

  const transcript = messages.map((m) => `${m.role === "user" ? "HIM" : "FATHERLY FRIEND"}: ${m.content}`).join("\n");
  const currentText = `Current settings: tone=${current.tone}, focus=${current.focus}, nextSteps=${current.nextSteps}, avoidTopics=${current.avoidTopics.join("|") || "none"}`;
  const raw = await provider.generate({
    system: SUGGEST_INSTRUCTIONS,
    messages: [{ role: "user", content: `${currentText}\n\nConversation:\n${transcript}` }],
  });
  return { kind: "suggestions", suggestions: parseSuggestions(raw, current) };
}

export function describeSuggestion(s: Suggestion): string {
  switch (s.field) {
    case "tone":
      return `Tone: ${LABELS.tone[s.value]}`;
    case "focus":
      return `Focus: ${LABELS.focus[s.value]}`;
    case "nextSteps":
      return `Next steps: ${LABELS.nextSteps[s.value]}`;
    case "avoidTopic":
      return `Avoid unless you raise it: ${LABELS.avoidTopics[s.value]}`;
  }
}
