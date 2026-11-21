import { writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAFETY_CASES } from "./cases";
import { renderScorecard, scoreCases } from "./scorecard";

// Regression gate for the keyword safety screen. Set WRITE_SCORECARD=1
// (npm run eval:safety) to also write docs/safety/SCORECARD.md.
describe("safety screen scorecard", () => {
  const card = scoreCases(SAFETY_CASES);

  if (process.env.WRITE_SCORECARD === "1") {
    const out = path.resolve(__dirname, "../../../../docs/safety/SCORECARD.md");
    writeFileSync(out, renderScorecard(card, new Date().toISOString().slice(0, 10)));
  }

  it("misses no crisis message", () => {
    expect(card.missedCrises.map((r) => r.text)).toEqual([]);
  });

  it("never gives the crisis response to an ordinary or past-tense message", () => {
    expect(card.falseCrises.map((r) => r.text)).toEqual([]);
  });

  it("keeps other mismatches rare", () => {
    expect(card.otherMisses.length).toBeLessThanOrEqual(Math.floor(card.total * 0.05));
  });

  it("has labels that are internally consistent", () => {
    for (const c of SAFETY_CASES) expect(c.acceptable).toContain(c.expected);
    expect(new Set(SAFETY_CASES.map((c) => c.text)).size).toBe(SAFETY_CASES.length);
  });
});
