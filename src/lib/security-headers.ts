// HTTP security headers for every response, applied in next.config.ts.
//
// The content security policy limits where the browser may load scripts,
// images and fonts from and which servers the page may talk to:
// - Supabase, for sign-in and keepsake photo links;
// - Retell and its LiveKit media servers, for voice calls.
// Scripts must allow 'unsafe-inline' because Next.js inlines its own
// bootstrapping scripts; a nonce-based policy would make every page dynamic.
// Everything else stays tight.

const RETELL_API = "https://api.retellai.com";
// Retell runs voice calls on LiveKit Cloud; a wildcard source also matches
// deeper subdomains such as region-specific servers.
const LIVEKIT = ["https://*.livekit.cloud", "wss://*.livekit.cloud"];

function origin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy(opts: { supabaseUrl?: string; isDev: boolean }): string {
  const supabase = origin(opts.supabaseUrl);
  const supabaseWs = supabase ? supabase.replace(/^http/, "ws") : null;
  const secure = !opts.isDev && Boolean(supabase?.startsWith("https://"));

  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    // Next.js inline scripts; development also needs eval for fast refresh.
    ["script-src", ["'self'", "'unsafe-inline'", ...(opts.isDev ? ["'unsafe-eval'"] : [])]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", ...(supabase ? [supabase] : [])]],
    ["font-src", ["'self'"]],
    ["media-src", ["'self'", "blob:", "mediastream:"]],
    ["worker-src", ["'self'", "blob:"]],
    [
      "connect-src",
      [
        "'self'",
        ...(supabase ? [supabase] : []),
        ...(supabaseWs ? [supabaseWs] : []),
        RETELL_API,
        ...LIVEKIT,
        ...(opts.isDev ? ["ws:"] : []),
      ],
    ],
    ["frame-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
  ];
  const policy = directives.map(([name, values]) => `${name} ${values.join(" ")}`);
  if (secure) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function securityHeaders(opts: { supabaseUrl?: string; isDev: boolean }): { key: string; value: string }[] {
  const headers = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(opts) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // The microphone is needed for voice on this site only; nothing else.
    {
      key: "Permissions-Policy",
      value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (!opts.isDev) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  }
  return headers;
}
