import { z } from "zod";
import type { ChatProvider } from "@/lib/ai/types";
import { FATHERLY_FRIEND_PROMPT } from "@/lib/persona/system-prompt";
import {
  classifyMessage,
  classifySuggestion,
  mergeResults,
  type SafetyResult,
} from "@/lib/safety/classifier";
import { LIBRARY, MAX_PLAN_STEPS, MAX_STEP_CHARS, type Topic } from "./library";

export type TailorOutcome =
  | { kind: "steps"; steps: string[] }
  | { kind: "crisis" }
  | { kind: "not_configured" }
  | { kind: "unusable" };

const modelOutputSchema = z.object({
  steps: z.array(z.string().trim().min(1)).min(1).max(10),
});

export function buildTailorPrompt(topic: Topic, focus: string): { system: string; user: string } {
  const info = LIBRARY[topic];
  const system = [
    FATHERLY_FRIEND_PROMPT,
    "TASK",
    `Suggest 3 to ${MAX_PLAN_STEPS} small steps for a personal growth plan on the topic "${info.label}" (${info.blurb}).`,
    "Each step must be: one sentence; concrete; doable within about a week; safe; kind in tone; written as a gentle suggestion to him.",
    "Never suggest confronting someone who may be dangerous, contacting an estranged or abusive family member, stopping medication, or anything medical, legal or high-risk financially.",
    "Never require him to disclose painful memories to anyone.",
    `Keep each step under ${MAX_STEP_CHARS - 80} characters.`,
    "Here are examples of the right size and tone:",
    ...info.steps.slice(0, 3).map((s) => `- ${s}`),
    'Reply with JSON only, exactly in this shape: {"steps": ["...", "..."]}',
  ].join("\n");
  const user = focus
    ? `What I'd like to work on: ${focus}`
    : `I'd like to work on ${info.label.toLowerCase()}.`;
  return { system, user };
}

// Pulls the first JSON object out of the model's reply, tolerating code fences.
export function parseSteps(raw: string): string[] | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = modelOutputSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
    return parsed.success ? parsed.data.steps : null;
  } catch {
    return null;
  }
}

export async function tailorSteps(
  topic: Topic,
  focus: string,
  deps: {
    provider: ChatProvider | null;
    moderate?: (text: string) => Promise<SafetyResult | null>;
  },
): Promise<TailorOutcome> {
  // Screen what he wrote before anything else.
  let safety: SafetyResult = classifyMessage(focus);
  if (focus && deps.moderate && safety.level !== "crisis") {
    const moderated = await deps.moderate(focus);
    if (moderated) safety = mergeResults(safety, moderated);
  }
  if (safety.level === "crisis") return { kind: "crisis" };

  if (!deps.provider) return { kind: "not_configured" };

  const { system, user } = buildTailorPrompt(topic, focus);
  const raw = await deps.provider.generate({ system, messages: [{ role: "user", content: user }] });
  const parsed = parseSteps(raw);
  if (!parsed) return { kind: "unusable" };

  // Drop any step that is too long or trips the safety screen.
  const safe = parsed
    .filter((s) => s.length <= MAX_STEP_CHARS)
    .filter((s) => classifySuggestion(s).level === "none")
    .slice(0, MAX_PLAN_STEPS);

  return safe.length > 0 ? { kind: "steps", steps: safe } : { kind: "unusable" };
}
