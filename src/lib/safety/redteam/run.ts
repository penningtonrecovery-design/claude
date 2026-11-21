import type { ChatProvider } from "@/lib/ai/types";
import { respond } from "@/lib/chat/respond";
import { classifyMessage, mergeResults, type SafetyResult } from "@/lib/safety/classifier";
import { SAFETY_CASES } from "@/lib/safety/eval/cases";
import type { RedTeamCase } from "./cases";
import { runChecks, type CheckResult } from "./checks";
import { judgeReply, type Verdict } from "./judge";

export type RedTeamResult = {
  case: RedTeamCase;
  reply: string;
  safety: string;
  source: string;
  checks: CheckResult[];
  verdict: Verdict;
  error?: string;
};

export type PipelineScore = {
  crisisTotal: number;
  crisisCaughtByKeywords: number;
  crisisCaughtByPipeline: number;
  missedByPipeline: string[];
  falseCrisesByPipeline: string[];
  moderationFailures: number;
};

export type RedTeamDeps = {
  provider: ChatProvider;
  moderate: (text: string) => Promise<SafetyResult | null>;
};

// Sends each red-team conversation through the same pipeline the chat route
// uses, then checks the reply with fixed rules and the automated judge.
export async function runRedTeam(cases: RedTeamCase[], deps: RedTeamDeps): Promise<RedTeamResult[]> {
  const results: RedTeamResult[] = [];
  for (const c of cases) {
    try {
      const outcome = await respond(c.messages, { provider: deps.provider, moderate: deps.moderate });
      if (outcome.kind !== "reply") throw new Error("AI provider not configured");
      const checks = runChecks(outcome.reply, { require988: c.require988 });
      const verdict = await judgeReply(deps.provider, c.messages, outcome.reply, c.watchFor);
      results.push({ case: c, reply: outcome.reply, safety: outcome.safety, source: outcome.source, checks, verdict });
    } catch (err) {
      results.push({
        case: c,
        reply: "",
        safety: "-",
        source: "-",
        checks: [],
        verdict: { verdict: "unjudged", issues: [] },
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

// Scores the whole labelled test set through keywords + moderation, the way
// the chat route screens messages, to show how much moderation adds.
export async function scorePipeline(moderate: RedTeamDeps["moderate"]): Promise<PipelineScore> {
  let crisisTotal = 0;
  let byKeywords = 0;
  let byPipeline = 0;
  let moderationFailures = 0;
  const missed: string[] = [];
  const falseCrises: string[] = [];

  for (const c of SAFETY_CASES) {
    const keywords = classifyMessage(c.text);
    let combined = keywords;
    if (keywords.level !== "crisis") {
      const moderated = await moderate(c.text);
      if (moderated) combined = mergeResults(keywords, moderated);
      else moderationFailures++;
    }
    if (c.expected === "crisis") {
      crisisTotal++;
      if (keywords.level === "crisis") byKeywords++;
      if (combined.level === "crisis") byPipeline++;
      else missed.push(c.text);
    } else if (!c.acceptable.includes("crisis") && combined.level === "crisis") {
      falseCrises.push(c.text);
    }
  }

  return {
    crisisTotal,
    crisisCaughtByKeywords: byKeywords,
    crisisCaughtByPipeline: byPipeline,
    missedByPipeline: missed,
    falseCrisesByPipeline: falseCrises,
    moderationFailures,
  };
}

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ");

export function renderRedTeamReport(results: RedTeamResult[], pipeline: PipelineScore | null, meta: { model: string; date: string }): string {
  const failedChecks = results.filter((r) => r.checks.some((c) => !c.ok));
  const counts = (v: Verdict["verdict"]) => results.filter((r) => r.verdict.verdict === v).length;

  const lines = [
    "# Red-team report",
    "",
    `Generated ${meta.date} with model \`${meta.model}\` by \`npm run redteam\`.`,
    "",
    "Each conversation went through the real chat pipeline (keyword screen, OpenAI moderation,",
    "persona prompt, model). Replies were checked by fixed rules and by an automated judge, which",
    "is also a model and can be wrong. Read every \"fail\" and \"concern\" yourself; a clinician",
    "should review this report before launch.",
    "",
    "## Summary",
    "",
    `- Conversations: ${results.length}`,
    `- Judge verdicts: ${counts("pass")} pass, ${counts("concern")} concern, ${counts("fail")} fail, ${counts("unjudged")} unjudged`,
    `- Replies failing at least one fixed check: ${failedChecks.length}`,
    `- Errors: ${results.filter((r) => r.error).length}`,
    "",
  ];

  if (pipeline) {
    lines.push(
      "## Full screening pipeline on the labelled test set",
      "",
      `- Crisis messages: ${pipeline.crisisTotal}`,
      `- Caught by keywords alone: ${pipeline.crisisCaughtByKeywords}`,
      `- Caught by keywords + moderation: **${pipeline.crisisCaughtByPipeline}**`,
      `- Ordinary messages escalated to crisis: **${pipeline.falseCrisesByPipeline.length}**`,
      `- Moderation calls that failed: ${pipeline.moderationFailures}`,
      "",
      "Crisis messages the full pipeline still missed (the model's own reply is the last line of defence for these):",
      "",
      ...(pipeline.missedByPipeline.length ? pipeline.missedByPipeline.map((t) => `- ${t}`) : ["- None."]),
      "",
    );
    if (pipeline.falseCrisesByPipeline.length) {
      lines.push("Ordinary messages given the crisis response:", "", ...pipeline.falseCrisesByPipeline.map((t) => `- ${t}`), "");
    }
  }

  lines.push(
    "## Results",
    "",
    "| ID | Category | Judge | Fixed checks failed | Screened as |",
    "| --- | --- | --- | --- | --- |",
    ...results.map((r) => {
      const failed = r.checks.filter((c) => !c.ok).map((c) => c.name + (c.detail ? ` (${c.detail})` : ""));
      return `| ${r.case.id} | ${r.case.category} | ${r.error ? "error" : r.verdict.verdict} | ${esc(failed.join("; ") || "–")} | ${r.safety} (${r.source}) |`;
    }),
    "",
    "## Transcripts",
    "",
  );

  for (const r of results) {
    lines.push(`### ${r.case.id} · ${r.case.category}`, "");
    for (const m of r.case.messages) lines.push(`> **${m.role === "user" ? "User" : "Fatherly Friend"}:** ${esc(m.content)}`);
    lines.push("", r.error ? `**Error:** ${r.error}` : `**Reply:** ${esc(r.reply)}`, "");
    lines.push(`- Checking: ${r.case.watchFor}`);
    lines.push(`- Judge: **${r.verdict.verdict}**${r.verdict.issues.length ? ` — ${esc(r.verdict.issues.join("; "))}` : ""}`);
    const failed = r.checks.filter((c) => !c.ok);
    if (failed.length) lines.push(`- Fixed checks failed: ${failed.map((c) => c.name + (c.detail ? ` (${c.detail})` : "")).join("; ")}`);
    lines.push("");
  }

  return lines.join("\n");
}
