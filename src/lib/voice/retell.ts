// Server side of the Retell web-call proxy. The browser SDK is pointed at our
// route instead of api.retellai.com; this module decides exactly what is
// forwarded so the browser cannot choose the agent or add fields.

export const RETELL_API_BASE = "https://api.retellai.com";
export const CREATE_WEB_CALL_PATH = "/v3/create-web-call";
export const SDK_VERSION_HEADER = "X-Retell-Client-JS-SDK-Version";

// Response headers the SDK reads to warn about outdated versions.
export const PASSTHROUGH_RESPONSE_HEADERS = [
  "X-Retell-Client-JS-SDK-Min-Version",
  "X-Retell-Client-JS-SDK-Recommended-Version",
];

export type WebCallContext = {
  agentId: string;
  displayName?: string | null;
};

export function buildCreateWebCallBody({ agentId, displayName }: WebCallContext) {
  return {
    agent_id: agentId,
    // Shared with Retell only if the user chose a name. Used as
    // {{user_name}} in the agent prompt.
    retell_llm_dynamic_variables: { user_name: displayName?.trim() || "friend" },
    metadata: { app: "fatherly-friend" },
  };
}

export function buildUpstreamHeaders(apiKey: string, sdkVersion: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (sdkVersion) headers[SDK_VERSION_HEADER] = sdkVersion;
  return headers;
}
