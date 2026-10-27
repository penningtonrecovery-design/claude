import { z } from "zod";
import { classifyMessage } from "@/lib/safety/classifier";

export const MEMORY_CATEGORIES = ["goal", "experience", "preference", "challenge", "achievement", "other"] as const;
export const MAX_MEMORY_CHARS = 500;

export const memoryInputSchema = z.object({
  category: z.enum(MEMORY_CATEGORIES),
  content: z.string().trim().min(1).max(MAX_MEMORY_CHARS),
});

export type MemoryCheck =
  | { ok: true; category: (typeof MEMORY_CATEGORIES)[number]; content: string }
  | { ok: false; reason: "invalid" | "crisis" };

// Validates a memory before saving. Crisis-level text is not stored, so it
// is never fed back into later conversations.
export function checkMemory(input: { category: unknown; content: unknown }): MemoryCheck {
  const parsed = memoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  if (classifyMessage(parsed.data.content).level === "crisis") return { ok: false, reason: "crisis" };
  return { ok: true, ...parsed.data };
}

// Prefill for the "Remember this" editor: his words, trimmed to fit.
export function prefillFromMessage(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= MAX_MEMORY_CHARS ? clean : `${clean.slice(0, MAX_MEMORY_CHARS - 1).trimEnd()}…`;
}
