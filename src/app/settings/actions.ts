"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string } | undefined;

const MEMORY_CATEGORIES = ["goal", "experience", "preference", "challenge", "achievement", "other"] as const;

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
  const parsed = z
    .object({
      category: z.enum(MEMORY_CATEGORIES),
      content: z.string().trim().min(1).max(500),
    })
    .safeParse({ category: formData.get("category"), content: formData.get("content") });
  if (!parsed.success) return { error: "Write a short note (up to 500 characters)." };

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("memory_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.memory_enabled) return { error: "Turn memory on first." };

  const { error } = await supabase.from("memories").insert(parsed.data);
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
  // Profile and memories are removed by ON DELETE CASCADE.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "We couldn't delete your account. Please try again." };
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
