import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ getCurrentUser: () => getCurrentUser() }));

const { POST } = await import("./route");

function fakeSupabase(displayName: string | null) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: { display_name: displayName } }),
  };
  return { from: () => chain };
}

function request(body: unknown = { agent_id: "agent_chosen_by_browser", metadata: { evil: true } }) {
  return new NextRequest("http://localhost:3000/api/voice/web-call", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Retell-Client-JS-SDK-Version": "3.0.3" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/voice/web-call", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RETELL_API_KEY", "key_server_secret");
    vi.stubEnv("RETELL_AGENT_ID", "agent_from_server");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    fetchMock.mockReset();
    getCurrentUser.mockReset();
  });

  it("rejects signed-out requests without contacting Retell", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(null), user: null });
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports when voice is not configured", async () => {
    vi.stubEnv("RETELL_API_KEY", "");
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(null), user: { id: "u1" } });
    const res = await POST(request());
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a server-built body with the server's agent and key", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase("Marcus"), user: { id: "u1" } });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ call_id: "call_1", access_token: "tok" }), {
        status: 201,
        headers: { "X-Retell-Client-JS-SDK-Min-Version": "3.0.0" },
      }),
    );

    const res = await POST(request());
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.retellai.com/v3/create-web-call");
    expect(init.headers.Authorization).toBe("Bearer key_server_secret");
    expect(init.headers["X-Retell-Client-JS-SDK-Version"]).toBe("3.0.3");
    expect(JSON.parse(init.body)).toEqual({
      agent_id: "agent_from_server",
      retell_llm_dynamic_variables: { user_name: "Marcus" },
      metadata: { app: "fatherly-friend" },
    });

    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ call_id: "call_1", access_token: "tok" });
    expect(text).not.toContain("key_server_secret");
    expect(res.headers.get("X-Retell-Client-JS-SDK-Min-Version")).toBe("3.0.0");
  });

  it("does not pass Retell's error body through to the browser", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(null), user: { id: "u1" } });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error_message: "internal detail" }), { status: 401 }));
    const res = await POST(request());
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("internal detail");
  });
});
