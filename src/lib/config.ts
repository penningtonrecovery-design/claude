// Reads configuration from environment variables and reports what is missing.
// Nothing here throws: the app must render and explain itself when a service
// is not configured, rather than crash or pretend.

export type SupabasePublicConfig = { url: string; publishableKey: string };

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function getSupabaseSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY || null;
}

export type AiConfig = { provider: "openai"; apiKey: string; model: string };

export function getAiConfig(): AiConfig | null {
  const provider = process.env.AI_PROVIDER || "openai";
  if (provider !== "openai") return null;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return null;
  return { provider, apiKey, model };
}

export type VoiceConfig = { apiKey: string; agentId: string };

export function getVoiceConfig(): VoiceConfig | null {
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  if (!apiKey || !agentId) return null;
  return { apiKey, agentId };
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}
