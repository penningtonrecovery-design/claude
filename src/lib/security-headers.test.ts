import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const prod = { supabaseUrl: "https://abc.supabase.co", isDev: false };

function directive(policy: string, name: string): string[] {
  const found = policy.split("; ").find((d) => d.startsWith(`${name} `) || d === name);
  return found ? found.split(" ").slice(1) : [];
}

describe("content security policy", () => {
  const policy = contentSecurityPolicy(prod);

  it("blocks framing, plugins and foreign forms", () => {
    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(policy, "object-src")).toEqual(["'none'"]);
    expect(directive(policy, "form-action")).toEqual(["'self'"]);
    expect(directive(policy, "base-uri")).toEqual(["'self'"]);
  });

  it("loads scripts only from this site, without eval in production", () => {
    const scripts = directive(policy, "script-src");
    expect(scripts).toContain("'self'");
    expect(scripts).not.toContain("'unsafe-eval'");
    expect(scripts.some((s) => s.startsWith("http"))).toBe(false);
  });

  it("lets the page reach Supabase and the voice service, and nothing else", () => {
    expect(directive(policy, "connect-src")).toEqual([
      "'self'",
      "https://abc.supabase.co",
      "wss://abc.supabase.co",
      "https://api.retellai.com",
      "https://*.livekit.cloud",
      "wss://*.livekit.cloud",
    ]);
  });

  it("shows keepsake photos from Supabase Storage", () => {
    expect(directive(policy, "img-src")).toContain("https://abc.supabase.co");
  });

  it("upgrades insecure requests in production only", () => {
    expect(policy).toContain("upgrade-insecure-requests");
    const local = contentSecurityPolicy({ supabaseUrl: "http://127.0.0.1:54321", isDev: true });
    expect(local).not.toContain("upgrade-insecure-requests");
    expect(directive(local, "script-src")).toContain("'unsafe-eval'");
    expect(directive(local, "connect-src")).toContain("http://127.0.0.1:54321");
  });

  it("copes with a missing or invalid Supabase URL", () => {
    expect(directive(contentSecurityPolicy({ supabaseUrl: "not a url", isDev: false }), "connect-src")[1]).toBe(
      "https://api.retellai.com",
    );
  });
});

describe("security headers", () => {
  it("sets the standard protections and limits the microphone to this site", () => {
    const headers = Object.fromEntries(securityHeaders(prod).map((h) => [h.key, h.value]));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["Permissions-Policy"]).toContain("microphone=(self)");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("leaves HSTS off in development", () => {
    expect(securityHeaders({ isDev: true }).some((h) => h.key === "Strict-Transport-Security")).toBe(false);
  });
});
