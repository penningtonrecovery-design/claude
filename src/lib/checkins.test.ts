import { describe, expect, it } from "vitest";
import { classifySuggestion } from "@/lib/safety/classifier";
import { GENERAL_NOTES, isCheckinDue, pickCheckin, STEP_NOTES } from "./checkins";

const now = new Date("2026-10-27T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

describe("check-in library", () => {
  const all = [...GENERAL_NOTES, ...STEP_NOTES];

  it("has unique keys", () => {
    expect(new Set(all.map((n) => n.key)).size).toBe(all.length);
  });

  // The brief forbids guilt-inducing or dependency-building messages.
  it.each(all.map((n) => [n.key, n.text]))("%s avoids guilt and dependency language", (_key, text) => {
    expect(text).not.toMatch(
      /\bmiss(ed)? you\b|\bhaven'?t\b|been a while|\bstreak\b|don'?t forget|\bshould\b|\bneed me\b|\bcome back\b|\blonely without\b|!/i,
    );
    expect(classifySuggestion(text).level).toBe("none");
  });

  it("step notes all have a {step} slot; general notes have none", () => {
    for (const n of STEP_NOTES) expect(n.text).toContain("{step}");
    for (const n of GENERAL_NOTES) expect(n.text).not.toContain("{step}");
  });
});

describe("isCheckinDue", () => {
  it("never fires when off", () => {
    expect(isCheckinDue({ now, frequency: "off", enabledAt: daysAgo(100), lastCheckinAt: null })).toBe(false);
  });

  it("waits a full interval after he turns check-ins on", () => {
    expect(isCheckinDue({ now, frequency: "weekly", enabledAt: daysAgo(6), lastCheckinAt: null })).toBe(false);
    expect(isCheckinDue({ now, frequency: "weekly", enabledAt: daysAgo(7), lastCheckinAt: null })).toBe(true);
  });

  it("counts from the last check-in he answered or dismissed", () => {
    expect(isCheckinDue({ now, frequency: "biweekly", enabledAt: daysAgo(60), lastCheckinAt: daysAgo(13) })).toBe(false);
    expect(isCheckinDue({ now, frequency: "biweekly", enabledAt: daysAgo(60), lastCheckinAt: daysAgo(14) })).toBe(true);
    expect(isCheckinDue({ now, frequency: "monthly", enabledAt: daysAgo(60), lastCheckinAt: daysAgo(29) })).toBe(false);
  });

  it("is not due without an anchor date", () => {
    expect(isCheckinDue({ now, frequency: "weekly", enabledAt: null, lastCheckinAt: null })).toBe(false);
  });
});

describe("pickCheckin", () => {
  it("uses general notes when there are no open steps", () => {
    for (let d = 0; d < 30; d++) {
      const note = pickCheckin({ now: new Date(now.getTime() + d * 86_400_000), lastKey: null, openSteps: [] });
      expect(note.key.startsWith("g-")).toBe(true);
    }
  });

  it("sometimes names one of his open steps, trimmed and without a doubled full stop", () => {
    const keys = new Set<string>();
    for (let d = 0; d < 10; d++) {
      const note = pickCheckin({
        now: new Date(now.getTime() + d * 86_400_000),
        lastKey: null,
        openSteps: ["Take a walk after dinner."],
      });
      keys.add(note.key.slice(0, 2));
      if (note.key.startsWith("s-")) {
        expect(note.text).toContain('"Take a walk after dinner"');
        expect(note.text).not.toContain("{step}");
      }
    }
    expect(keys).toEqual(new Set(["g-", "s-"]));
  });

  it("shortens long steps", () => {
    const evenDay = new Date(Math.floor(now.getTime() / 86_400_000 / 2) * 2 * 86_400_000);
    const note = pickCheckin({ now: evenDay, lastKey: null, openSteps: ["x".repeat(300)] });
    expect(note.text).toContain("…");
    expect(note.text.length).toBeLessThan(250);
  });

  it("never repeats the last note", () => {
    for (let d = 0; d < 30; d++) {
      const date = new Date(now.getTime() + d * 86_400_000);
      const first = pickCheckin({ now: date, lastKey: null, openSteps: ["a step"] });
      const second = pickCheckin({ now: date, lastKey: first.key, openSteps: ["a step"] });
      expect(second.key).not.toBe(first.key);
    }
  });

  it("is stable within a day", () => {
    const a = pickCheckin({ now, lastKey: null, openSteps: [] });
    const b = pickCheckin({ now: new Date(now.getTime() + 3_600_000), lastKey: null, openSteps: [] });
    expect(a).toEqual(b);
  });
});
