import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSupabasePublicConfig, getSupabaseSecretKey } from "@/lib/config";

// A per-request client that acts as the signed-in user. Row-level security
// policies apply to every query it makes.
export async function createClient() {
  // Session reads are per-request; tell Next not to prerender past this point.
  await connection();
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

// Bypasses row-level security. Use only for operations a user cannot perform
// on their own row, such as deleting their auth account.
export function createAdminClient() {
  const config = getSupabasePublicConfig();
  const secretKey = getSupabaseSecretKey();
  if (!config || !secretKey) return null;
  return createSupabaseClient(config.url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
