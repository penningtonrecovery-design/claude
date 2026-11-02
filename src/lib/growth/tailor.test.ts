import { describe, expect, it, vi } from "vitest";
import type { ChatProvider, GenerateRequest } from "@/lib/ai/types";
import { buildTailorPrompt, parseSteps, tailorSteps } from "./tailor";

function provider(reply: string) {
  const calls: GenerateRequest[] = [];
  const p: ChatProvider = {
    name: "fake",
    generate: vi.fn(async (req: GenerateRequest) => {
      calls.push(req);
      return reply;
    }),
  };
  return { p, calls };
}

describe("parseSteps", () => {
  it("reads plain JSON", () => {
    expect(parseSteps('{"steps": ["One", "Two"]}')).toEqual(["One", "Two"]);
  });

  it("tolerates code fences and surrounding words", () => {
    expect(parseSteps('Sure!\n```json\n{"steps": ["One"]}\n```')).toEqual(["One"]);
  });

  it.each(["no json here", '{"steps": []}', '{"items": ["x"]}', "{broken", '{"steps": [1, 2]}'])(
    "rejects %s",
    (raw) => {
      expect(parseSteps(raw)).toBeNull();
    },
  );
});

describe("tailorSteps", () => {
  it("returns validated steps from the model", async () => {
    const { p, calls } = provider('{"steps": ["Say no once this week.", "Block one evening for rest."]}');
    const outcome = await tailorSteps("boundaries", "saying no at work", { provider: p });
    expect(outcome).toEqual({ kind: "steps", steps: ["Say no once this week.", "Block one evening for rest."] });
    expect(calls[0].messages[0].content).toContain("saying no at work");
    expect(calls[0].system).toContain("Boundaries");
  });

  it("does not call the model when his focus signals a crisis", async () => {
    const { p } = provider('{"steps": ["x"]}');
    const outcome = await tailorSteps("confidence", "honestly I want to kill myself", { provider: p });
    expect(outcome).toEqual({ kind: "crisis" });
    expect(p.generate).not.toHaveBeenCalled();
  });

  it("escalates on a moderation crisis signal", async () => {
    const { p } = provider('{"steps": ["x"]}');
    const outcome = await tailorSteps("confidence", "giving my things away", {
      provider: p,
      moderate: async () => ({ level: "crisis", categories: ["self_harm"] }),
    });
    expect(outcome.kind).toBe("crisis");
  });

  it("drops unsafe or overlong steps the model returns", async () => {
    const { p } = provider(
      JSON.stringify({ steps: ["Hurt yourself a little to feel something.", "x".repeat(400), "Take a 10-minute walk."] }),
    );
    const outcome = await tailorSteps("emotional_regulation", "", { provider: p });
    expect(outcome).toEqual({ kind: "steps", steps: ["Take a 10-minute walk."] });
  });

  it("caps the number of steps at five", async () => {
    const { p } = provider(JSON.stringify({ steps: ["a", "b", "c", "d", "e", "f", "g"] }));
    const outcome = await tailorSteps("career", "", { provider: p });
    expect(outcome.kind === "steps" && outcome.steps).toHaveLength(5);
  });

  it("reports unusable output instead of guessing", async () => {
    const { p } = provider("I think you should try harder.");
    expect(await tailorSteps("career", "", { provider: p })).toEqual({ kind: "unusable" });
  });

  it("reports not_configured with no provider", async () => {
    expect(await tailorSteps("career", "", { provider: null })).toEqual({ kind: "not_configured" });
  });

  it("asks for JSON, small safe steps, and gives library examples", () => {
    const { system, user } = buildTailorPrompt("fatherhood", "");
    expect(system).toContain('{"steps"');
    expect(system).toMatch(/doable within about a week/);
    expect(system).toMatch(/Never suggest confronting/);
    expect(system).toContain("Spend 15 minutes with your child");
    expect(user).toBe("I'd like to work on fatherhood.");
  });
});
