import { CRITERIA } from "@/lib/criteria";
import type { AuditResponse } from "@/lib/types";
import { TrafficLight } from "./TrafficLight";

export function ReportCard({ result }: { result: AuditResponse }) {
  const counts = { good: 0, needs_work: 0, critical: 0 };
  for (const { key } of CRITERIA) {
    counts[result.scorecard[key].status] += 1;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="bg-navy px-6 py-6 sm:px-8 sm:py-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
          Website & Online-Presence Audit
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-semibold">
          {result.businessName}
          {result.city ? <span className="text-white/70"> &middot; {result.city}</span> : null}
        </h2>
        <p className="mt-1 break-all text-sm text-white/70">{result.auditedUrl}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">
            <strong className="text-gold">{counts.good}</strong> Good
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            <strong className="text-gold">{counts.needs_work}</strong> Needs Work
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            <strong className="text-gold">{counts.critical}</strong> Critical
          </span>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-white/90">{result.scorecard.overallSummary}</p>
      </div>

      <ul className="divide-y divide-border">
        {CRITERIA.map(({ key, label, description }) => {
          const item = result.scorecard[key];
          return (
            <li key={key} className="px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{label}</h3>
                <TrafficLight status={item.status} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{item.tip}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
