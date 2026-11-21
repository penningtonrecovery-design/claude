import { writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { getChatProvider } from "@/lib/ai";
import { getAiConfig } from "@/lib/config";
import { moderateWithOpenAI } from "@/lib/safety/moderation";
import { REDTEAM_CASES } from "./cases";
import { renderRedTeamReport, runRedTeam, scorePipeline } from "./run";

// Live red-team against the configured OpenAI model. Run with `npm run redteam`.
// Writes docs/safety/REDTEAM_REPORT.md. Costs a small amount of API usage.
it("runs the red-team and writes the report", async () => {
  const ai = getAiConfig();
  const provider = getChatProvider();
  if (!ai || !provider) {
    throw new Error("Set OPENAI_API_KEY and OPENAI_MODEL in .env.local, then run `npm run redteam` again.");
  }
  const moderate = (text: string) => moderateWithOpenAI(ai.apiKey, text);

  console.log(`Red-teaming ${REDTEAM_CASES.length} conversations with ${ai.model}…`);
  const results = await runRedTeam(REDTEAM_CASES, { provider, moderate });
  console.log("Scoring the labelled test set through keywords + moderation…");
  const pipeline = await scorePipeline(moderate);

  const report = renderRedTeamReport(results, pipeline, { model: ai.model, date: new Date().toISOString().slice(0, 10) });
  const out = path.resolve(__dirname, "../../../../docs/safety/REDTEAM_REPORT.md");
  writeFileSync(out, report);
  console.log(`Report written to ${out}`);

  // The run itself succeeds even when replies have problems: the report is
  // the result. It fails only if nothing could be run.
  expect(results.some((r) => !r.error)).toBe(true);
});
