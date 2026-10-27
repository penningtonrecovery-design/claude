import { describe, expect, it, vi } from "vitest";
import type { ChatProvider, GenerateRequest } from "@/lib/ai/types";
import { CRISIS_RESPONSE, HARM_TO_OTHERS_RESPONSE } from "@/lib/safety/responses";
import { respond } from "./respond";

function fakeProvider(reply = "Tell me more about that.") {
  const calls: GenerateRequest[] = [];
  const provider: ChatProvider = {
    name: "fake",
    generate: vi.fn(async (req: GenerateRequest) => {
      calls.push(req);
      return reply;
    }),
  };
  return { provider, calls };
}

const user = (content: string) => [{ role: "user" as const, content }];

describe("respond", () => {
  it("answers crisis messages with the fixed response and never calls the model", async () => {
    const { provider } = fakeProvider();
    const outcome = await respond(user("I want to kill myself"), { provider });
    expect(outcome).toEqual({ kind: "reply", reply: CRISIS_RESPONSE, safety: "crisis", source: "safety" });
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it("still answers crisis messages when no model is configured", async () => {
    const outcome = await respond(user("I don't want to be alive anymore"), { provider: null });
    expect(outcome.kind).toBe("reply");
    if (outcome.kind === "reply") expect(outcome.reply).toContain("988");
  });

  it("uses the harm-to-others response when that is the only risk", async () => {
    const outcome = await respond(user("I'm going to hurt him"), { provider: null });
    expect(outcome.kind === "reply" && outcome.reply).toBe(HARM_TO_OTHERS_RESPONSE);
  });

  it("escalates to crisis when moderation flags intent the keywords missed", async () => {
    const { provider } = fakeProvider();
    const moderate = vi.fn(async () => ({ level: "crisis" as const, categories: ["self_harm" as const] }));
    const outcome = await respond(user("I've started giving my things away"), { provider, moderate });
    expect(outcome.kind === "reply" && outcome.source).toBe("safety");
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it("skips moderation when keywords already found a crisis", async () => {
    const moderate = vi.fn(async () => null);
    await respond(user("I want to end my life"), { provider: null, moderate });
    expect(moderate).not.toHaveBeenCalled();
  });

  it("falls back to keywords when moderation fails", async () => {
    const { provider } = fakeProvider();
    const outcome = await respond(user("What should I say to my son?"), {
      provider,
      moderate: async () => null,
    });
    expect(outcome).toMatchObject({ kind: "reply", safety: "none", source: "model" });
  });

  it("adds safety instructions to the system prompt for distress", async () => {
    const { provider, calls } = fakeProvider();
    const outcome = await respond(user("I feel completely hopeless"), { provider });
    expect(outcome).toMatchObject({ safety: "distress", source: "model" });
    expect(calls[0].system).toContain("SAFETY CONTEXT");
    expect(calls[0].system).toContain("988");
  });

  it("does not add safety instructions to ordinary messages", async () => {
    const { provider, calls } = fakeProvider();
    await respond(user("How do I talk to my brother again?"), { provider });
    expect(calls[0].system).not.toContain("SAFETY CONTEXT");
  });

  it("reports not_configured for ordinary messages with no model", async () => {
    expect(await respond(user("hello"), { provider: null })).toEqual({
      kind: "not_configured",
      safety: "none",
    });
  });

  it("passes the user's name and saved memories into the prompt", async () => {
    const { provider, calls } = fakeProvider();
    await respond(user("hi"), {
      provider,
      displayName: "Marcus",
      memories: [{ category: "goal", content: "Be more patient with my son" }],
    });
    expect(calls[0].system).toContain("call him Marcus");
    expect(calls[0].system).toContain("(goal) Be more patient with my son");
  });
});
