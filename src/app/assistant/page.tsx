"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bot, Info, Sparkles } from "lucide-react";
import { useDemo } from "@/lib/store";
import { ASSISTANT_SCOPE_NOTE, rulesSummary, runAssistant, type Finding, type Severity } from "@/lib/assistant";
import { Button, Card, Empty, PageHeader, Tabs, cx } from "@/components/ui";
import { RequireRole } from "@/components/AppShell";
import { STATIC_DEMO } from "@/lib/env";

export default function AssistantPage() {
  return (
    <RequireRole roles={["supervisor", "admin"]}>
      <Assistant />
    </RequireRole>
  );
}

const SEV: Record<Severity, string> = {
  high: "bg-red-700 text-white",
  medium: "bg-amber-400 text-slate-950",
  low: "bg-slate-200 text-slate-900",
};

function Assistant() {
  const { state, now } = useDemo();
  const findings = useMemo(() => runAssistant(state, now), [state, now]);
  const [sev, setSev] = useState<"all" | Severity>("all");
  const [llm, setLlm] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<{ text: string; source: "claude" | "rules"; note?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (STATIC_DEMO) {
      setLlm(false);
      return;
    }
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setLlm(Boolean(d.llmAvailable)))
      .catch(() => setLlm(false));
  }, []);

  const generate = async () => {
    setLoading(true);
    const fallback = rulesSummary(findings);
    try {
      if (!llm) {
        setSummary({ text: fallback, source: "rules" });
        return;
      }
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ findings: findings.map((f: Finding) => ({ severity: f.severity, title: f.title, detail: f.detail, whereToLook: f.whereToLook })) }),
      });
      const d = await res.json();
      if (d.source === "claude" && d.summary) setSummary({ text: d.summary, source: "claude" });
      else setSummary({ text: fallback, source: "rules", note: d.reason });
    } catch {
      setSummary({ text: fallback, source: "rules", note: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const counts = { high: 0, medium: 0, low: 0 };
  findings.forEach((f) => counts[f.severity]++);
  const shown = findings.filter((f) => sev === "all" || f.severity === sev);

  return (
    <div>
      <PageHeader
        title="AI administrative assistant"
        subtitle={`Reviews the last 4 days of fictional records for missing or inconsistent documentation. Mode: ${llm === null ? "checking…" : llm ? "rules + Claude wording" : "offline rules engine"}.`}
      />
      <Card className="mb-5 flex gap-3 border-2 border-blue-300 bg-blue-50 p-4">
        <Info className="h-6 w-6 shrink-0 text-blue-800" aria-hidden />
        <div>
          <p className="font-semibold text-slate-900">{ASSISTANT_SCOPE_NOTE}</p>
          <p className="text-slate-700">It never advises whether a medication should be given, withheld, substituted or adjusted. Findings are prompts for human review.</p>
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Bot className="h-6 w-6" aria-hidden /> Review summary
          </h2>
          <Button onClick={generate} disabled={loading}>
            <Sparkles className="h-5 w-5" aria-hidden /> {loading ? "Generating…" : summary ? "Regenerate" : "Generate summary"}
          </Button>
        </div>
        {summary ? (
          <div className="mt-3">
            <p className="whitespace-pre-line text-lg leading-relaxed text-slate-800">{summary.text}</p>
            <p className="mt-2 text-sm text-slate-500">
              Source: {summary.source === "claude" ? "Claude (wording only) from rules-engine findings, passed through a clinical-advice filter" : "deterministic rules engine"}
              {summary.note && ` · ${summary.note}`}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-slate-600">
            {findings.length} finding(s): {counts.high} high, {counts.medium} medium, {counts.low} low. Generate a plain-language summary for a shift handover.
          </p>
        )}
      </Card>

      <Tabs
        tabs={[
          { id: "all", label: `All (${findings.length})` },
          { id: "high", label: `High (${counts.high})` },
          { id: "medium", label: `Medium (${counts.medium})` },
          { id: "low", label: `Low (${counts.low})` },
        ]}
        value={sev}
        onChange={setSev}
      />
      {shown.length === 0 ? (
        <Empty>No findings at this level.</Empty>
      ) : (
        <ul className="space-y-3">
          {shown.map((f) => (
            <li key={f.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cx("rounded-full px-2.5 py-0.5 text-sm font-bold uppercase", SEV[f.severity])}>{f.severity}</span>
                  <h3 className="text-lg font-bold">{f.title}</h3>
                </div>
                <p className="mt-1 text-slate-700">{f.detail}</p>
                <Link href={f.whereToLook.href} className="mt-2 inline-block font-semibold text-brand-700 underline">
                  Where to look: {f.whereToLook.label} →
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
