import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { KEEPSAKE_LINK_SECONDS } from "./options";

export const KEEPSAKE_BUCKET = "keepsakes";

// A short-lived link to the user's own keepsake. Storage access rules mean
// the signed-in user can only sign links for files in their own folder.
export async function signKeepsakeUrl(supabase: SupabaseClient, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(KEEPSAKE_BUCKET).createSignedUrl(path, KEEPSAKE_LINK_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}
