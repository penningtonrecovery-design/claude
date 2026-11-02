import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ getCurrentUser: () => getCurrentUser() }));

const { POST } = await import("./route");

function fakeSupabase() {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: async () => ({ data: [] }),
    maybeSingle: async () => ({ data: { display_name: null, memory_enabled: false } }),
  };
  return { from: () => chain };
}

function request(body: unknown) {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_MODEL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    getCurrentUser.mockReset();
  });

  it("requires sign-in", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: null });
    const res = await POST(request({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(401);
  });

  it("rejects malformed requests", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    const res = await POST(request({ messages: [{ role: "system", content: "x" }] }));
    expect(res.status).toBe(400);
  });

  it("returns crisis support even when no AI provider is configured", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    const res = await POST(request({ messages: [{ role: "user", content: "I want to kill myself" }] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.safety).toBe("crisis");
    expect(body.reply).toContain("988");
  });

  it("says plainly when the AI provider is not configured", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    const res = await POST(request({ messages: [{ role: "user", content: "hello" }] }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("ai_not_configured");
  });
});
