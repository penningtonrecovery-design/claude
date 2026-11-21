import { classifyMessage, type SafetyLevel } from "../classifier";
import type { SafetyCase } from "./cases";

export type CaseResult = SafetyCase & { actual: SafetyLevel; correct: boolean };

export type Scorecard = {
  total: number;
  correct: number;
  // Crisis messages screened below crisis. Must be zero.
  missedCrises: CaseResult[];
  // Known misses the keyword screen is not expected to catch.
  knownGaps: CaseResult[];
  // Messages that should never get the crisis response but did. Must be zero.
  falseCrises: CaseResult[];
  // Any other result outside the acceptable levels (less severe problems).
  otherMisses: CaseResult[];
  byGroup: { group: string; total: number; correct: number }[];
  results: CaseResult[];
};

export function scoreCases(cases: SafetyCase[]): Scorecard {
  const results: CaseResult[] = cases.map((c) => {
    const actual = classifyMessage(c.text).level;
    return { ...c, actual, correct: c.acceptable.includes(actual) };
  });

  const allMissed = results.filter((r) => r.expected === "crisis" && r.actual !== "crisis");
  const missedCrises = allMissed.filter((r) => !r.knownGap);
  const knownGaps = allMissed.filter((r) => r.knownGap);
  const falseCrises = results.filter((r) => !r.acceptable.includes("crisis") && r.actual === "crisis");
  const otherMisses = results.filter(
    (r) => !r.correct && !allMissed.includes(r) && !falseCrises.includes(r),
  );

  const groups = [...new Set(results.map((r) => r.group))];
  const byGroup = groups.map((group) => {
    const inGroup = results.filter((r) => r.group === group);
    return { group, total: inGroup.length, correct: inGroup.filter((r) => r.correct).length };
  });

  return {
    total: results.length,
    correct: results.filter((r) => r.correct).length,
    missedCrises,
    knownGaps,
    falseCrises,
    otherMisses,
    byGroup,
    results,
  };
}

const pct = (n: number, d: number) => (d === 0 ? "–" : `${Math.round((n / d) * 100)}%`);

export function renderScorecard(card: Scorecard, date: string): string {
  const row = (r: CaseResult) =>
    `| ${r.text.replace(/\|/g, "\\|")} | ${r.group} | ${r.expected} | ${r.actual} |`;
  const table = (rows: CaseResult[]) =>
    rows.length === 0
      ? "None.\n"
      : ["| Message | Group | Expected | Screened as |", "| --- | --- | --- | --- |", ...rows.map(row)].join("\n") + "\n";

  return [
    "# Safety screen scorecard",
    "",
    `Generated ${date} by \`npm run eval:safety\` from \`src/lib/safety/eval/cases.ts\`.`,
    "",
    "This measures the keyword screen only (`src/lib/safety/classifier.ts`). In the app, OpenAI",
    "moderation adds a second check when configured, so real-world recall should be higher.",
    "The test set was written by engineering and needs clinician review; passing it is not",
    "evidence of clinical safety.",
    "",
    "## Summary",
    "",
    `- Cases: ${card.total}`,
    `- Screened acceptably: ${card.correct} (${pct(card.correct, card.total)})`,
    `- **Crisis messages missed: ${card.missedCrises.length}** (must be 0)`,
    `- **Ordinary messages given the crisis response: ${card.falseCrises.length}** (must be 0)`,
    `- Known gaps (crisis messages keywords can't catch; see below): ${card.knownGaps.length}`,
    `- Other mismatches (less severe): ${card.otherMisses.length}`,
    "",
    "## By group",
    "",
    "| Group | Cases | Acceptable |",
    "| --- | --- | --- |",
    ...card.byGroup.map((g) => `| ${g.group} | ${g.total} | ${g.correct} (${pct(g.correct, g.total)}) |`),
    "",
    "## Crisis messages missed",
    "",
    table(card.missedCrises),
    "## Known gaps",
    "",
    "Crisis messages from a held-out batch that the keyword screen still misses. They show",
    "why the screen cannot be the main safeguard; see docs/safety/README.md.",
    "",
    table(card.knownGaps),
    "## Ordinary messages given the crisis response",
    "",
    table(card.falseCrises),
    "## Other mismatches",
    "",
    "Usually a distress or abuse message screened as \"none\" (no resource banner shown), or the reverse.",
    "",
    table(card.otherMisses),
  ].join("\n");
}
