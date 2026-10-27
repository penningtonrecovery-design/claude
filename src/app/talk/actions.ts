"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkMemory } from "@/lib/memory/save";
import { getCurrentUser } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  confirmAdult: z.literal("on"),
  acknowledgeLimits: z.literal("on"),
  memory: z.enum(["on", "off"]),
});

export type OnboardingState = { error?: string } | undefined;

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName") ?? undefined,
    confirmAdult: formData.get("confirmAdult"),
    acknowledgeLimits: formData.get("acknowledgeLimits"),
    memory: formData.get("memory") ?? "off",
  });
  if (!parsed.success) {
    return { error: "Please confirm both statements to continue." };
  }

  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) return { error: "Your session has ended. Please sign in again." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName || null,
      memory_enabled: parsed.data.memory === "on",
      confirmed_adult_at: now,
      acknowledged_limits_at: now,
      onboarding_completed_at: now,
    })
    .eq("id", user.id);

  if (error) return { error: "We couldn't save that. Please try again." };
  revalidatePath("/talk");
  return undefined;
}

// Records that he answered or dismissed a check-in, which starts the next interval.
export async function markCheckinSeen(key: string): Promise<void> {
  const parsed = z.string().max(40).safeParse(key);
  if (!parsed.success) return;
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) return;
  await supabase
    .from("profiles")
    .update({ last_checkin_at: new Date().toISOString(), last_checkin_key: parsed.data })
    .eq("id", user.id);
}

export type RememberResult = { ok: true } | { ok: false; error: string; crisis?: boolean };

// Saves one of his own chat messages (as he edited it) to memory.
export async function rememberFromChat(category: string, content: string): Promise<RememberResult> {
  const check = checkMemory({ category, content });
  if (!check.ok) {
    return check.reason === "crisis"
      ? {
          ok: false,
          crisis: true,
          error: "I won't save this one to memory. It sounds like a lot to carry, and you deserve real support with it right now.",
        }
      : { ok: false, error: "Keep it to a sentence or two (up to 500 characters) and pick a kind." };
  }

  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("memory_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.memory_enabled) return { ok: false, error: "Memory is off. Turn it on in Settings to save things." };

  const { error } = await supabase
    .from("memories")
    .insert({ category: check.category, content: check.content, source: "conversation" });
  if (error) return { ok: false, error: "Couldn't save that. Please try again." };
  revalidatePath("/settings");
  return { ok: true };
}
