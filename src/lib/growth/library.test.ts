import { describe, expect, it } from "vitest";
import { classifyMessage } from "@/lib/safety/classifier";
import { isTopic, LIBRARY, MAX_PLAN_STEPS, MAX_STEP_CHARS, TOPICS } from "./library";

describe("step library", () => {
  it("covers all ten topics from the brief", () => {
    expect(TOPICS).toHaveLength(10);
    for (const topic of TOPICS) expect(LIBRARY[topic]).toBeDefined();
  });

  it.each(TOPICS)("%s has enough well-formed steps", (topic) => {
    const { label, blurb, steps } = LIBRARY[topic];
    expect(label.length).toBeGreaterThan(0);
    expect(blurb.length).toBeGreaterThan(0);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(MAX_PLAN_STEPS);
    for (const step of steps) {
      expect(step.length).toBeLessThanOrEqual(MAX_STEP_CHARS);
      expect(classifyMessage(step).level).toBe("none");
    }
  });

  it("recognises topics", () => {
    expect(isTopic("boundaries")).toBe(true);
    expect(isTopic("astrology")).toBe(false);
    expect(isTopic(undefined)).toBe(false);
  });
});
