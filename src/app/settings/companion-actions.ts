"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { KEEPSAKE_BUCKET } from "@/lib/companion/keepsake";
import { keepsakePath, MAX_CAPTION_CHARS, parseCompanionChoice } from "@/lib/companion/options";
import { processKeepsakePhoto } from "@/lib/companion/process-photo";
import { consumeRateLimit, limitMessage } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";

export type CompanionState = { error?: string; ok?: string } | undefined;

async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/settings");
  return { supabase, user };
}

const captionSchema = z.string().trim().max(MAX_CAPTION_CHARS);

export async function setCompanionMode(_prev: CompanionState, formData: FormData): Promise<CompanionState> {
  const parsed = parseCompanionChoice(formData.get("choice"));
  if (!parsed) return { error: "Choose how he appears." };
  const { mode, avatar } = parsed;
  const { supabase, user } = await requireUser();

  if (mode === "photo") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("keepsake_path")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.keepsake_path) return { error: "Add a photo first, below." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      companion_mode: mode,
      ...(avatar ? { avatar_id: avatar } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/settings");
  revalidatePath("/talk");
  return { ok: "Saved." };
}

export async function uploadKeepsake(_prev: CompanionState, formData: FormData): Promise<CompanionState> {
  if (formData.get("rights") !== "on") {
    return { error: "Please confirm you have the right to use this photo." };
  }
  const caption = captionSchema.safeParse(formData.get("caption") ?? "");
  if (!caption.success) return { error: `Keep the caption to ${MAX_CAPTION_CHARS} characters.` };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo to upload." };

  const { supabase, user } = await requireUser();
  // Checked before the photo is processed, which is the expensive part.
  const limit = await consumeRateLimit(supabase, "upload");
  if (!limit.allowed) return { error: limitMessage("upload", limit) };

  const processed = await processKeepsakePhoto(Buffer.from(await file.arrayBuffer()));
  if (!processed.ok) {
    const message = {
      too_large: "That photo is too large. Try one under 4 MB.",
      not_an_image: "That file isn't a photo we can use. Try a JPEG, PNG or WebP image.",
      too_small: "That photo is too small to show well. Try a larger one.",
    }[processed.reason];
    return { error: message };
  }

  const path = keepsakePath(user.id);
  const { error: uploadError } = await supabase.storage
    .from(KEEPSAKE_BUCKET)
    .upload(path, processed.data, { contentType: "image/jpeg", upsert: true });
  if (uploadError) return { error: "We couldn't save the photo. Please try again." };

  const { error } = await supabase
    .from("profiles")
    .update({
      keepsake_path: path,
      keepsake_caption: caption.data || null,
      keepsake_rights_confirmed_at: new Date().toISOString(),
      companion_mode: "photo",
    })
    .eq("id", user.id);
  if (error) return { error: "We saved the photo but couldn't update your settings. Please try again." };

  revalidatePath("/settings");
  revalidatePath("/talk");
  return { ok: "Photo saved. It now sits beside Fatherly Friend in conversations." };
}

export async function updateKeepsakeCaption(_prev: CompanionState, formData: FormData): Promise<CompanionState> {
  const caption = captionSchema.safeParse(formData.get("caption") ?? "");
  if (!caption.success) return { error: `Keep the caption to ${MAX_CAPTION_CHARS} characters.` };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ keepsake_caption: caption.data || null })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save the caption." };
  revalidatePath("/settings");
  revalidatePath("/talk");
  return { ok: "Caption saved." };
}

export async function removeKeepsake(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.storage.from(KEEPSAKE_BUCKET).remove([keepsakePath(user.id)]);
  const { data: profile } = await supabase
    .from("profiles")
    .select("companion_mode")
    .eq("id", user.id)
    .maybeSingle();
  await supabase
    .from("profiles")
    .update({
      keepsake_path: null,
      keepsake_caption: null,
      keepsake_rights_confirmed_at: null,
      ...(profile?.companion_mode === "photo" ? { companion_mode: "voice" } : {}),
    })
    .eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/talk");
}
