import { describe, expect, it } from "vitest";
import { checkMemory, MAX_MEMORY_CHARS, prefillFromMessage } from "./save";

describe("checkMemory", () => {
  it("accepts a normal memory", () => {
    expect(checkMemory({ category: "goal", content: "  Be more patient with my son  " })).toEqual({
      ok: true,
      category: "goal",
      content: "Be more patient with my son",
    });
  });

  it.each([
    [{ category: "goal", content: "" }],
    [{ category: "goal", content: "x".repeat(MAX_MEMORY_CHARS + 1) }],
    [{ category: "secret", content: "hello" }],
    [{ category: undefined, content: "hello" }],
  ])("rejects invalid input %#", (input) => {
    expect(checkMemory(input)).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuses to store crisis-level text", () => {
    expect(checkMemory({ category: "experience", content: "Some nights I want to kill myself" })).toEqual({
      ok: false,
      reason: "crisis",
    });
  });

  it("allows hard but non-crisis experiences he chooses to keep", () => {
    expect(checkMemory({ category: "experience", content: "My dad died by suicide when I was ten" }).ok).toBe(true);
  });
});

describe("prefillFromMessage", () => {
  it("collapses whitespace and keeps short messages whole", () => {
    expect(prefillFromMessage("  I want to\n\nbe a better dad  ")).toBe("I want to be a better dad");
  });

  it("trims long messages to the memory limit", () => {
    const out = prefillFromMessage("word ".repeat(200));
    expect(out.length).toBeLessThanOrEqual(MAX_MEMORY_CHARS);
    expect(out.endsWith("…")).toBe(true);
  });
});
