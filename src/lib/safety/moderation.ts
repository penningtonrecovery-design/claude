import "server-only";
import OpenAI from "openai";
import type { SafetyResult } from "./classifier";

// Second-pass screen using OpenAI's moderation model. Any failure returns
// null so the caller falls back to the keyword screen alone.
export async function moderateWithOpenAI(
  apiKey: string,
  text: string,
): Promise<SafetyResult | null> {
  try {
    const client = new OpenAI({ apiKey });
    const result = await client.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });
    const categories = result.results[0]?.categories;
    if (!categories) return null;

    if (categories["self-harm/intent"] || categories["self-harm/instructions"]) {
      return { level: "crisis", categories: ["self_harm"] };
    }
    if (categories["self-harm"]) {
      return { level: "distress", categories: ["self_harm"] };
    }
    return { level: "none", categories: [] };
  } catch {
    console.warn("[safety] moderation check failed; using keyword screen only");
    return null;
  }
}
