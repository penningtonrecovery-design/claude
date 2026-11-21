import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

// Browser-only. Call from event handlers or effects, not during render.
export function createClient() {
  if (!url || !key) throw new Error("Supabase is not configured");
  return createBrowserClient(url, key);
}
