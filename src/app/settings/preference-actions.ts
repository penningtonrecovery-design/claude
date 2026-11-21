"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { preferencesSchema } from "@/lib/personalization/preferences";
import type { Suggestion } from "@/lib/personalization/suggest";
import { getCurrentUser } from "@/lib/supabase/server";
import { z } from "zod";
import { AVOID_TOPICS, FOCUSES, NEXT_STEP_FREQUENCIES, TONES } from "@/lib/personalization/preferences";

export type PreferenceState = { error?: string; ok?: string } | undefined;

async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/settings");
  return { supabase, user };
}

export async function savePreferences(_prev: PreferenceState, formData: FormData): Promise<PreferenceState> {
  const parsed = preferencesSchema.safeParse({
    tone: formData.get("tone"),
    focus: formData.get("focus"),
    nextSteps: formData.get("nextSteps"),
    faith: formData.get("faith"),
    avoidTopics: formData.getAll("avoidTopics"),
    lifeContext: formData.getAll("lifeContext"),
  });
  if (!parsed.success) return { error: "Something in the form didn't look right. Please try again." };
  const p = parsed.data;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      pref_tone: p.tone,
      pref_focus: p.focus,
      pref_next_steps: p.nextSteps,
      pref_faith: p.faith,
      pref_avoid_topics: [...new Set(p.avoidTopics)],
      life_context: [...new Set(p.lifeContext)],
    })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/settings");
  return { ok: "Saved. He'll talk with you this way from your next message." };
}

const suggestionSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("tone"), value: z.enum(TONES) }),
  z.object({ field: z.literal("focus"), value: z.enum(FOCUSES) }),
  z.object({ field: z.literal("nextSteps"), value: z.enum(NEXT_STEP_FREQUENCIES) }),
  z.object({ field: z.literal("avoidTopic"), value: z.enum(AVOID_TOPICS) }),
]);

// Applies one suggestion he accepted in the chat.
export async function acceptSuggestion(suggestion: Pick<Suggestion, "field" | "value">): Promise<{ error?: string }> {
  const parsed = suggestionSchema.safeParse(suggestion);
  if (!parsed.success) return { error: "That suggestion couldn't be applied." };
  const s = parsed.data;
  const { supabase, user } = await requireUser();

  let update: Record<string, unknown>;
  if (s.field === "avoidTopic") {
    const { data } = await supabase.from("profiles").select("pref_avoid_topics").eq("id", user.id).maybeSingle();
    const current: string[] = Array.isArray(data?.pref_avoid_topics) ? data.pref_avoid_topics : [];
    update = { pref_avoid_topics: [...new Set([...current, s.value])] };
  } else {
    const column = { tone: "pref_tone", focus: "pref_focus", nextSteps: "pref_next_steps" }[s.field];
    update = { [column]: s.value };
  }
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "Couldn't save that change." };
  revalidatePath("/settings");
  return {};
}
