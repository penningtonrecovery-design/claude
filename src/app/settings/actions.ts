"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isCheckinFrequency } from "@/lib/checkins";
import { checkMemory } from "@/lib/memory/save";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string } | undefined;

async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/settings");
  return { supabase, user };
}

export async function updateDisplayName(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.string().trim().max(60).safeParse(formData.get("displayName") ?? "");
  if (!parsed.success) return { error: "Please keep it under 60 characters." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data || null })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/settings");
  return { ok: "Saved." };
}

export async function setMemoryEnabled(formData: FormData): Promise<void> {
  const enabled = formData.get("enabled") === "true";
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ memory_enabled: enabled }).eq("id", user.id);
  revalidatePath("/settings");
}

export async function addMemory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const check = checkMemory({ category: formData.get("category"), content: formData.get("content") });
  if (!check.ok) {
    return check.reason === "crisis"
      ? { error: "This sounds like a lot to carry. Rather than save it, please reach out to someone now: call or text 988, or call 911 if you're in danger." }
      : { error: "Write a short note (up to 500 characters)." };
  }

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("memory_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.memory_enabled) return { error: "Turn memory on first." };

  const { error } = await supabase
    .from("memories")
    .insert({ category: check.category, content: check.content, source: "settings" });
  if (error) return { error: "Couldn't save that note. Please try again." };
  revalidatePath("/settings");
  return { ok: "Saved. He'll keep this in mind." };
}

export async function deleteMemory(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  // Row-level security limits this to the user's own memories.
  await supabase.from("memories").delete().eq("id", id.data);
  revalidatePath("/settings");
}

export async function deleteAllMemories(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("memories").delete().eq("user_id", user.id);
  revalidatePath("/settings");
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE to confirm." };
  const { supabase, user } = await requireUser();
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Account deletion isn't configured on this server yet (missing SUPABASE_SECRET_KEY)." };
  }
  // Profile, memories, plans and reflections are removed by ON DELETE CASCADE.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "We couldn't delete your account. Please try again." };
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}

export async function setCheckinFrequency(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const frequency = formData.get("frequency");
  if (!isCheckinFrequency(frequency)) return { error: "Choose one of the options." };
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("checkin_frequency")
    .eq("id", user.id)
    .maybeSingle();
  // Turning check-ins on (from off) starts the clock; changing frequency keeps it.
  const turningOn = frequency !== "off" && profile?.checkin_frequency === "off";
  const { error } = await supabase
    .from("profiles")
    .update({
      checkin_frequency: frequency,
      ...(turningOn ? { checkin_enabled_at: new Date().toISOString(), last_checkin_at: null } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/settings");
  return { ok: frequency === "off" ? "Check-ins are off." : "Saved." };
}
