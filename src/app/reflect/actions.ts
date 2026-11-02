"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { snoozeUntil } from "@/lib/growth/reflection";
import { parseReflectionForm } from "@/lib/growth/schemas";
import { getCurrentUser } from "@/lib/supabase/server";

export type ReflectionState = { error?: string } | undefined;

async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/reflect");
  return { supabase, user };
}

export async function saveReflection(_prev: ReflectionState, formData: FormData): Promise<ReflectionState> {
  const parsed = parseReflectionForm(formData);
  if (!parsed.success) return { error: "Something in the form didn't look right. Notes can be up to 500 characters." };
  const values = parsed.data;
  const anything = Object.values(values).some((v) => v !== null);
  if (!anything) return { error: "Answer at least one question, or come back another time." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("reflections").insert(values);
  if (error) return { error: "We couldn't save your reflection. Please try again." };

  await supabase.from("profiles").update({ reflection_snoozed_until: null }).eq("id", user.id);
  revalidatePath("/reflect");
  redirect("/reflect?saved=1");
}

export async function snoozeReflection(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ reflection_snoozed_until: snoozeUntil(new Date()).toISOString() })
    .eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function setReflectionPrompts(formData: FormData): Promise<void> {
  const enabled = formData.get("enabled") === "true";
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ reflection_prompts_enabled: enabled }).eq("id", user.id);
  revalidatePath("/settings");
}

export async function deleteReflection(formData: FormData): Promise<void> {
  const reflectionId = z.uuid().safeParse(formData.get("id"));
  if (!reflectionId.success) return;
  const { supabase } = await requireUser();
  await supabase.from("reflections").delete().eq("id", reflectionId.data);
  revalidatePath("/reflect");
}
