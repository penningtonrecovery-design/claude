import type { SupabaseClient } from "@supabase/supabase-js";

// The limits themselves live in the database function consume_rate_limit
// (supabase/migrations/20261121030000_rate_limits.sql), so a caller can't
// choose its own.
export type RateLimitAction = "chat" | "voice" | "tailor" | "suggest" | "upload" | "export";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; window: "minute" | "day"; retryAfterSeconds: number };

// Records one use of an action for the signed-in user. If the check itself
// fails (database unreachable, migration missing) the request is allowed and
// a warning is logged: a fault in cost control should not cut a man off
// mid-conversation.
export async function consumeRateLimit(
  supabase: Pick<SupabaseClient, "rpc">,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc("consume_rate_limit", { p_action: action });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.allowed !== "boolean") {
      console.warn(`[rate-limit] check failed for ${action}; allowing`);
      return { allowed: true };
    }
    if (row.allowed) return { allowed: true };
    return {
      allowed: false,
      window: row.limit_window === "day" ? "day" : "minute",
      retryAfterSeconds: Math.max(1, Math.round(Number(row.retry_after_seconds) || 60)),
    };
  } catch {
    console.warn(`[rate-limit] check failed for ${action}; allowing`);
    return { allowed: true };
  }
}

export function describeWait(seconds: number): string {
  if (seconds <= 90) return "in a minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `in about ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours <= 1 ? "in about an hour" : `in about ${hours} hours`;
}

const WHAT: Record<RateLimitAction, string> = {
  chat: "messages",
  voice: "voice conversations",
  tailor: "tailored plan suggestions",
  suggest: "style suggestions",
  upload: "photo uploads",
  export: "data downloads",
};

// A calm, plain message for when a limit is reached.
export function limitMessage(action: RateLimitAction, limit: Extract<RateLimitResult, { allowed: false }>): string {
  const when = describeWait(limit.retryAfterSeconds);
  const base =
    limit.window === "minute"
      ? `That's a lot of ${WHAT[action]} in a short time. Take a breath; you can carry on ${when}.`
      : `You've reached today's limit for ${WHAT[action]}. You can pick this up again ${when}.`;
  return action === "chat" || action === "voice"
    ? `${base} If you need someone right now, call or text 988.`
    : base;
}

export function retryAfterHeader(limit: Extract<RateLimitResult, { allowed: false }>): Record<string, string> {
  return { "Retry-After": String(limit.retryAfterSeconds) };
}
