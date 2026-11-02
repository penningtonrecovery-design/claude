import { z } from "zod";
import { MAX_FOCUS_CHARS, MAX_PLAN_STEPS, MAX_STEP_CHARS, MIN_PLAN_STEPS, TOPICS } from "./library";
import { REFLECTION_AREAS } from "./reflection";

export const stepInputSchema = z.object({
  content: z.string().trim().min(1).max(MAX_STEP_CHARS),
  source: z.enum(["library", "ai", "user"]),
});

export const createPlanSchema = z.object({
  topic: z.enum(TOPICS),
  focus: z.string().trim().max(MAX_FOCUS_CHARS).optional().default(""),
  steps: z.array(stepInputSchema).min(MIN_PLAN_STEPS).max(MAX_PLAN_STEPS),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const tailorRequestSchema = z.object({
  topic: z.enum(TOPICS),
  focus: z.string().trim().max(MAX_FOCUS_CHARS).optional().default(""),
});

const rating = z
  .union([z.literal(""), z.coerce.number().int().min(1).max(5)])
  .transform((v) => (v === "" ? null : v));
const note = z
  .string()
  .trim()
  .max(500)
  .transform((v) => v || null);

// Built from FormData: "<area>" holds the rating ("" when skipped) and
// "<area>_note" the optional words.
export function parseReflectionForm(formData: FormData) {
  const shape: Record<string, unknown> = {};
  for (const { key } of REFLECTION_AREAS) {
    shape[key] = formData.get(key) ?? "";
    shape[`${key}_note`] = formData.get(`${key}_note`) ?? "";
  }
  shape.proud_of = formData.get("proud_of") ?? "";

  const schema = z.object({
    confidence: rating,
    wellbeing: rating,
    relationships: rating,
    identity: rating,
    responsibility: rating,
    confidence_note: note,
    wellbeing_note: note,
    relationships_note: note,
    identity_note: note,
    responsibility_note: note,
    proud_of: note,
  });
  return schema.safeParse(shape);
}
