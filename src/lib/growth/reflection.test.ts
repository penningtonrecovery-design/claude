import { describe, expect, it } from "vitest";
import { isReflectionDue, snoozeUntil } from "./reflection";
import { parseReflectionForm } from "./schemas";

const now = new Date("2026-10-27T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
const base = { now, promptsEnabled: true, snoozedUntil: null, onboardedAt: null, lastReflectionAt: null };

describe("isReflectionDue", () => {
  it("is due 30 days after onboarding when he has never reflected", () => {
    expect(isReflectionDue({ ...base, onboardedAt: daysAgo(30) })).toBe(true);
    expect(isReflectionDue({ ...base, onboardedAt: daysAgo(29) })).toBe(false);
  });

  it("counts from the last reflection when there is one", () => {
    expect(isReflectionDue({ ...base, onboardedAt: daysAgo(90), lastReflectionAt: daysAgo(10) })).toBe(false);
    expect(isReflectionDue({ ...base, onboardedAt: daysAgo(90), lastReflectionAt: daysAgo(31) })).toBe(true);
  });

  it("respects snooze and the off switch", () => {
    const due = { ...base, onboardedAt: daysAgo(45) };
    expect(isReflectionDue({ ...due, snoozedUntil: snoozeUntil(now).toISOString() })).toBe(false);
    expect(isReflectionDue({ ...due, snoozedUntil: daysAgo(1) })).toBe(true);
    expect(isReflectionDue({ ...due, promptsEnabled: false })).toBe(false);
  });

  it("is never due before onboarding", () => {
    expect(isReflectionDue(base)).toBe(false);
  });

  it("snoozes for seven days", () => {
    expect(snoozeUntil(now).toISOString()).toBe("2026-11-03T12:00:00.000Z");
  });
});

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("parseReflectionForm", () => {
  it("turns skipped areas and empty notes into nulls", () => {
    const result = parseReflectionForm(form({ confidence: "4", wellbeing: "", proud_of: "  Called my dad  " }));
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      confidence: 4,
      wellbeing: null,
      relationships: null,
      confidence_note: null,
      proud_of: "Called my dad",
    });
  });

  it.each(["0", "6", "3.5", "abc"])("rejects rating %s", (value) => {
    expect(parseReflectionForm(form({ confidence: value })).success).toBe(false);
  });

  it("rejects overlong notes", () => {
    expect(parseReflectionForm(form({ identity_note: "x".repeat(501) })).success).toBe(false);
  });
});
