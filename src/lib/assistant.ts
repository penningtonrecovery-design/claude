// AI Administrative Assistant — deterministic rules engine.
// Scope: documentation completeness and consistency ONLY.
// It never recommends whether to give, withhold, substitute or adjust any medication,
// and it has no ability to change orders, doses or records.
import { buildDoseViews, needsReview } from "./doses";
import { HOUR, addDays, dateKey, fmtDateTime } from "./time";
import { OUTCOME_LABEL, type DemoState, type DoseView } from "./types";

export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  rule: string;
  severity: Severity;
  title: string;
  detail: string;
  whereToLook: { label: string; href: string };
  residentId?: string;
  doseId?: string;
}

const name = (v: DoseView) => `${v.resident.firstName} ${v.resident.lastName} (Room ${v.resident.room})`;
const med = (v: DoseView) => `${v.order.name} ${v.order.strength}`;

export const ASSISTANT_SCOPE_NOTE =
  "The assistant reviews documentation only. It does not give clinical advice, and it cannot change orders, doses or records. Staff and supervisors decide what to do.";

export function runAssistant(state: DemoState, now: number, lookbackDays = 3): Finding[] {
  const today = dateKey(now);
  const views = buildDoseViews(state, addDays(today, -lookbackDays), today, now);
  const staffName = new Map(state.staff.map((s) => [s.id, s.name]));
  const findings: Finding[] = [];
  const push = (f: Finding) => findings.push(f);

  for (const v of views) {
    const residentHref = `/residents/${v.residentId}`;
    if (v.status === "overdue") {
      const isToday = v.date === today;
      push({
        id: `missing:${v.id}`,
        rule: isToday ? "overdue-documentation" : "missing-documentation",
        severity: "high",
        title: isToday ? "Overdue documentation" : "Missing documentation",
        detail: `No record exists for ${med(v)} scheduled ${fmtDateTime(v.scheduledAt)} for ${name(v)}. Staff should check what happened and document it, or record the reason it was not documented.`,
        whereToLook: { label: "Supervisor dashboard", href: "/supervisor" },
        residentId: v.residentId,
        doseId: v.id,
      });
    }

    if (needsReview(v) && v.record) {
      push({
        id: `review:${v.id}`,
        rule: "exception-unreviewed",
        severity: "medium",
        title: `${OUTCOME_LABEL[v.record.outcome]} dose has no supervisor review`,
        detail: `${staffName.get(v.record.staffId) ?? "A staff member"} recorded "${OUTCOME_LABEL[v.record.outcome]}" (${v.record.reason}) for ${med(v)} — ${name(v)}. No supervisor review is on file yet.`,
        whereToLook: { label: "Exceptions needing review", href: "/supervisor#exceptions" },
        residentId: v.residentId,
        doseId: v.id,
      });
    }

    for (const r of v.history) {
      if (r.outcome !== "administered" && !r.note && !state.records.some((x) => x.supersedesId === r.id)) {
        push({
          id: `nonote:${r.id}`,
          rule: "exception-without-note",
          severity: "low",
          title: "Exception recorded without a note",
          detail: `"${OUTCOME_LABEL[r.outcome]}" for ${med(v)} — ${name(v)} on ${fmtDateTime(r.scheduledAt)} has a reason ("${r.reason}") but no explanatory note. Check whether your facility's documentation policy expects one.`,
          whereToLook: { label: "Resident profile", href: residentHref },
          residentId: v.residentId,
          doseId: v.id,
        });
      }
      if (!r.supersedesId && r.recordedAt - r.scheduledAt > 2 * HOUR) {
        push({
          id: `late:${r.id}`,
          rule: "late-entry",
          severity: "low",
          title: "Late documentation entry",
          detail: `${med(v)} for ${name(v)} was scheduled ${fmtDateTime(r.scheduledAt)} but documented ${fmtDateTime(r.recordedAt)} by ${staffName.get(r.staffId) ?? "unknown"}. A late entry may need a supervisor's note explaining the delay.`,
          whereToLook: { label: "Audit trail", href: "/audit" },
          residentId: v.residentId,
          doseId: v.id,
        });
      }
      if (v.order.discontinuedAt !== undefined && r.scheduledAt >= v.order.discontinuedAt) {
        push({
          id: `disc:${r.id}`,
          rule: "record-after-discontinuation",
          severity: "high",
          title: "Record against a discontinued order",
          detail: `A record exists for ${med(v)} — ${name(v)} on ${fmtDateTime(r.scheduledAt)}, but this order was discontinued ${fmtDateTime(v.order.discontinuedAt)}. The record and the order status are inconsistent and need human review.`,
          whereToLook: { label: "Resident profile", href: residentHref },
          residentId: v.residentId,
          doseId: v.id,
        });
      }
      if (r.supersedesId) {
        const original = state.records.find((x) => x.id === r.supersedesId);
        if (original && r.recordedAt - original.recordedAt > 24 * HOUR) {
          push({
            id: `latecorr:${r.id}`,
            rule: "late-correction",
            severity: "medium",
            title: "Correction made more than 24 hours later",
            detail: `A record for ${med(v)} — ${name(v)} was corrected ${fmtDateTime(r.recordedAt)}, more than a day after the original entry. Correction reason on file: "${r.correctionReason}".`,
            whereToLook: { label: "Audit trail", href: "/audit" },
            residentId: v.residentId,
            doseId: v.id,
          });
        }
      }
    }
  }

  // Repeated exceptions for the same order — a documentation pattern for a supervisor to look at.
  const byOrder = new Map<string, DoseView[]>();
  for (const v of views) if (v.status === "exception") byOrder.set(v.orderId, [...(byOrder.get(v.orderId) ?? []), v]);
  for (const [orderId, list] of byOrder) {
    if (list.length >= 2) {
      const v = list[0];
      push({
        id: `pattern:${orderId}`,
        rule: "repeated-exceptions",
        severity: "medium",
        title: "Repeated exceptions recorded for the same order",
        detail: `${list.length} exceptions (${list.map((x) => OUTCOME_LABEL[x.record!.outcome].toLowerCase()).join(", ")}) were documented for ${med(v)} — ${name(v)} in the last ${lookbackDays + 1} days. A supervisor may want to confirm the facility's follow-up and notification steps are documented.`,
        whereToLook: { label: "Resident profile", href: `/residents/${v.residentId}` },
        residentId: v.residentId,
      });
    }
  }

  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function rulesSummary(findings: Finding[]): string {
  if (findings.length === 0) return "No documentation gaps or inconsistencies were found in the review period. Continue routine checks.";
  const c = { high: 0, medium: 0, low: 0 };
  findings.forEach((f) => c[f.severity]++);
  const byRule = new Map<string, number>();
  findings.forEach((f) => byRule.set(f.title, (byRule.get(f.title) ?? 0) + 1));
  const parts = [...byRule.entries()].map(([t, n]) => `${n} × ${t.toLowerCase()}`);
  return `The review found ${findings.length} item(s) for staff to check: ${c.high} high, ${c.medium} medium and ${c.low} low priority. Breakdown: ${parts.join("; ")}. Start with the high-priority items on the supervisor dashboard. These are documentation findings only; any care decision belongs to qualified staff following the orders on file.`;
}

/**
 * Guardrail used on any model-generated text. Returns true if the text appears to
 * give clinical direction (give / withhold / change a medication or dose).
 */
export function containsClinicalAdvice(text: string): boolean {
  const t = text.toLowerCase();
  const patterns = [
    /\b(should|must|recommend|advise|suggest|consider|need to|ought to)\b[^.]{0,60}\b(administer|give|withhold|hold off|skip|omit|increase|decrease|reduce|raise|lower|adjust|titrate|double|halve|substitut|switch|stop|discontinue|start|restart)\w*\b[^.]{0,40}\b(medication|medicine|dose|dosage|drug|tablet|capsule|mg|pill)/,
    /\b(increase|decrease|reduce|raise|lower|double|halve|adjust|titrate)\b[^.]{0,30}\b(the )?(dose|dosage|mg)\b/,
    /\b(do not|don't)\s+(give|administer)\b/,
    /\b(safe|unsafe) to (give|administer|take)\b/,
    /\b(instead of|replace (it|this) with)\b[^.]{0,40}\b(medication|drug|tablet|mg)\b/,
  ];
  return patterns.some((p) => p.test(t));
}
