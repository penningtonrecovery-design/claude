"use client";

import { useState } from "react";
import { BellRing, Eye, Megaphone } from "lucide-react";
import { useDemo } from "@/lib/store";
import { buildDoseViews, needsReview } from "@/lib/doses";
import { reviewException, sendReminder } from "@/lib/actions";
import { completeness, dailySummary } from "@/lib/reports";
import { addDays, dateKey, fmtDateTime, relative } from "@/lib/time";
import { OUTCOME_LABEL, type DoseView } from "@/lib/types";
import { Button, Card, Dialog, Empty, ErrorNote, PageHeader, Stat, StatusBadge, cx, inputCls } from "@/components/ui";
import { DoseDialog } from "@/components/DoseDialog";
import { RequireRole } from "@/components/AppShell";

const ESCALATION_TARGETS = [
  "Administrator on call (simulated)",
  "Prescriber's office (simulated)",
  "Pharmacy (simulated)",
  "Resident's family contact (simulated)",
];

export default function SupervisorPage() {
  return (
    <RequireRole roles={["supervisor", "admin"]}>
      <SupervisorDashboard />
    </RequireRole>
  );
}

function SupervisorDashboard() {
  const { state, now, run } = useDemo();
  const [open, setOpen] = useState<string | null>(null);
  const [review, setReview] = useState<DoseView | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const today = dateKey(now);
  const views = buildDoseViews(state, addDays(today, -3), today, now);
  const overdueToday = views.filter((v) => v.status === "overdue" && v.date === today);
  const missingPrior = views.filter((v) => v.status === "overdue" && v.date !== today).reverse();
  const toReview = views.filter(needsReview).reverse();
  const pct = completeness(dailySummary(state, today, now).total);
  const staffName = (id: string) => state.staff.find((s) => s.id === id)?.name ?? id;
  const activity = state.audit.filter((e) => ["review.acknowledged", "review.escalated", "reminder.sent", "record.corrected"].includes(e.action)).slice(-12).reverse();

  const remind = (v: DoseView) => {
    const res = run((s, a, t) => sendReminder(s, a.id, v.id, t));
    setFlash(res.ok ? `Reminder sent (in-app, simulated) for ${v.order.name} — ${v.resident.firstName} ${v.resident.lastName}.` : res.error);
  };

  const Row = ({ v, actions }: { v: DoseView; actions: React.ReactNode }) => (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <StatusBadge status={v.status} />
      <div className="min-w-0 flex-1">
        <div className="font-bold">
          {v.order.name} {v.order.strength} — {v.resident.firstName} {v.resident.lastName} (Rm {v.resident.room})
        </div>
        <div className="text-slate-600">
          Scheduled {fmtDateTime(v.scheduledAt)} · {relative(v.scheduledAt, now)}
          {v.record && (
            <>
              {" "}
              · {OUTCOME_LABEL[v.record.outcome]} by {staffName(v.record.staffId)}: {v.record.reason}
              {v.record.note && ` — “${v.record.note}”`}
            </>
          )}
        </div>
      </div>
      <div className="no-print flex flex-wrap gap-2">{actions}</div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Supervisor dashboard" subtitle="Incomplete documentation, overdue doses and exceptions that need a human to review. Last 4 days." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Overdue today" value={overdueToday.length} tone="red" />
        <Stat label="Missing (prior 3 days)" value={missingPrior.length} tone="red" />
        <Stat label="Exceptions to review" value={toReview.length} tone="amber" />
        <Stat label="Today's completeness" value={pct === null ? "—" : `${Math.round(pct * 100)}%`} tone="green" hint="Documented ÷ doses past their window" />
      </div>

      {flash && (
        <div role="status" className="mb-4 rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-2 font-medium text-blue-900">
          {flash}
        </div>
      )}

      <Section title="Overdue documentation — today" count={overdueToday.length}>
        {overdueToday.length === 0 ? (
          <Empty>Nothing overdue today.</Empty>
        ) : (
          <Card className="divide-y divide-slate-200">
            {overdueToday.map((v) => (
              <Row
                key={v.id}
                v={v}
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setOpen(v.id)}>
                      <Eye className="h-4 w-4" aria-hidden /> Open
                    </Button>
                    <Button variant="warning" size="sm" onClick={() => remind(v)}>
                      <BellRing className="h-4 w-4" aria-hidden /> Remind caregiver
                    </Button>
                  </>
                }
              />
            ))}
          </Card>
        )}
      </Section>

      <Section title="Incomplete records — previous 3 days" count={missingPrior.length}>
        {missingPrior.length === 0 ? (
          <Empty>No missing documentation.</Empty>
        ) : (
          <Card className="divide-y divide-slate-200">
            {missingPrior.map((v) => (
              <Row
                key={v.id}
                v={v}
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setOpen(v.id)}>
                      <Eye className="h-4 w-4" aria-hidden /> Open
                    </Button>
                    <Button variant="warning" size="sm" onClick={() => remind(v)}>
                      <BellRing className="h-4 w-4" aria-hidden /> Remind caregiver
                    </Button>
                  </>
                }
              />
            ))}
          </Card>
        )}
      </Section>

      <Section id="exceptions" title="Exceptions requiring human review" count={toReview.length}>
        {toReview.length === 0 ? (
          <Empty>All exceptions have been reviewed.</Empty>
        ) : (
          <Card className="divide-y divide-slate-200">
            {toReview.map((v) => (
              <Row
                key={v.id}
                v={v}
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setOpen(v.id)}>
                      <Eye className="h-4 w-4" aria-hidden /> Open
                    </Button>
                    <Button size="sm" onClick={() => setReview(v)}>
                      <Megaphone className="h-4 w-4" aria-hidden /> Review / escalate
                    </Button>
                  </>
                }
              />
            ))}
          </Card>
        )}
      </Section>

      <Section title="Recent supervisor activity" count={activity.length}>
        <Card className="divide-y divide-slate-200">
          {activity.length === 0 && <div className="p-4 text-slate-600">No reviews, reminders or corrections yet.</div>}
          {activity.map((e) => (
            <div key={e.id} className="px-4 py-2">
              <span className="font-semibold">{e.actorName}</span> · <span className="text-slate-600">{fmtDateTime(e.at)}</span>
              <div>{e.summary}</div>
            </div>
          ))}
        </Card>
      </Section>

      <DoseDialog doseId={open} onClose={() => setOpen(null)} />
      <ReviewDialog
        view={review}
        onClose={() => setReview(null)}
        onSaved={(msg) => {
          setReview(null);
          setFlash(msg);
        }}
      />
    </div>
  );
}

function Section({ title, count, id, children }: { title: string; count: number; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-6 scroll-mt-40">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
        {title}
        <span className={cx("rounded-full px-2.5 text-base", count ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700")}>{count}</span>
      </h2>
      {children}
    </section>
  );
}

function ReviewDialog({ view, onClose, onSaved }: { view: DoseView | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const { run } = useDemo();
  const [action, setAction] = useState<"acknowledged" | "escalated">("acknowledged");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    setNote("");
    setTarget("");
    setError(null);
    setAction("acknowledged");
    onClose();
  };
  const save = () => {
    if (!view) return;
    const res = run((s, a, t) => reviewException(s, a.id, { doseId: view.id, action, note, escalatedTo: action === "escalated" ? target : undefined }, t));
    if (!res.ok) return setError(res.error);
    setNote("");
    setTarget("");
    onSaved(action === "escalated" ? `Escalated to ${target}. No real message was sent.` : "Review recorded in the audit trail.");
  };
  return (
    <Dialog
      open={!!view}
      onClose={close}
      title="Review exception"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!note.trim() || (action === "escalated" && !target)}>
            {action === "escalated" ? "Confirm escalation" : "Confirm review"}
          </Button>
        </>
      }
    >
      {view?.record && (
        <div className="space-y-4">
          <p className="rounded-xl bg-amber-50 p-3">
            <b>{OUTCOME_LABEL[view.record.outcome]}</b>: {view.order.name} {view.order.strength} — {view.resident.firstName} {view.resident.lastName}. Reason: {view.record.reason}
            {view.record.note && `. Note: “${view.record.note}”`}
          </p>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-1 font-bold">Action</legend>
            {(["acknowledged", "escalated"] as const).map((a) => (
              <label key={a} className={cx("flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 font-semibold", action === a ? "border-brand-700 bg-brand-50" : "border-slate-300")}>
                <input type="radio" name="action" checked={action === a} onChange={() => setAction(a)} className="h-5 w-5 accent-brand-700" />
                {a === "acknowledged" ? "Acknowledge (reviewed)" : "Escalate (simulated)"}
              </label>
            ))}
          </fieldset>
          {action === "escalated" && (
            <div>
              <label htmlFor="target" className="mb-1 block font-bold">
                Escalate to
              </label>
              <select id="target" className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Choose…</option>
                {ESCALATION_TARGETS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="rnote" className="mb-1 block font-bold">
              Review note (required)
            </label>
            <textarea id="rnote" rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you checked and any follow-up per facility policy" />
          </div>
          <p className="text-sm text-slate-600">Escalations are simulated: they create an in-app notification and an audit event only.</p>
          <ErrorNote error={error} />
        </div>
      )}
    </Dialog>
  );
}
