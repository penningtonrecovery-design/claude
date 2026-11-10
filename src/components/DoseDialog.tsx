"use client";

import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, PauseCircle, ShieldCheck, XCircle } from "lucide-react";
import { useDemo } from "@/lib/store";
import { canDocumentFor, correctRecord, documentDose, OUTCOMES, REASONS } from "@/lib/actions";
import { getDoseView } from "@/lib/doses";
import { OUTCOME_LABEL, ROLE_LABEL, type DoseView, type Outcome } from "@/lib/types";
import { fmtDateTime, fmtTime, relative } from "@/lib/time";
import { Avatar, Button, Dialog, ErrorNote, StatusBadge, cx, inputCls } from "./ui";

const OUTCOME_STYLE: Record<Outcome, { cls: string; icon: typeof CheckCircle2; help: string }> = {
  administered: { cls: "border-emerald-700 text-emerald-900 aria-pressed:bg-emerald-700 aria-pressed:text-white", icon: CheckCircle2, help: "Resident received the dose as ordered" },
  refused: { cls: "border-amber-600 text-amber-950 aria-pressed:bg-amber-400", icon: XCircle, help: "Resident declined" },
  held: { cls: "border-violet-700 text-violet-900 aria-pressed:bg-violet-700 aria-pressed:text-white", icon: PauseCircle, help: "Held per an instruction or protocol on file" },
  not_administered: { cls: "border-slate-600 text-slate-900 aria-pressed:bg-slate-700 aria-pressed:text-white", icon: Ban, help: "Not given for another reason" },
};

type Step = "details" | "outcome" | "confirm" | "done";

export function DoseDialog({ doseId, onClose }: { doseId: string | null; onClose: () => void }) {
  const { state, now, user, run } = useDemo();
  const view = doseId ? getDoseView(state, doseId, now) : undefined;
  return (
    <Dialog open={!!doseId && !!view} onClose={onClose} title={view ? `${view.order.name} ${view.order.strength}` : "Dose"} wide>
      {view && user && <DoseFlow key={view.id} view={view} onClose={onClose} run={run} userId={user.id} />}
    </Dialog>
  );
}

function DoseFlow({ view, onClose, run, userId }: { view: DoseView; onClose: () => void; run: ReturnType<typeof useDemo>["run"]; userId: string }) {
  const { state, now } = useDemo();
  const user = state.staff.find((s) => s.id === userId)!;
  const [step, setStep] = useState<Step>("details");
  const [mode, setMode] = useState<"document" | "correct">("document");
  const [outcome, setOutcome] = useState<Outcome | null>(null); // never pre-selected
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const staffName = (id: string) => state.staff.find((s) => s.id === id)?.name ?? id;
  const r = view.resident;
  const allowed = canDocumentFor(user, view.residentId);
  const tooEarly = view.scheduledAt - now > 2 * 60 * 60_000;
  const canCorrect = view.record && (user.role !== "caregiver" || view.record.staffId === user.id);

  const needsReason = outcome && outcome !== "administered";
  const outcomeValid =
    !!outcome && (!needsReason || (!!reason && (!reason.startsWith("Other") || note.trim()))) && (mode === "document" || correctionReason.trim().length > 0);

  const save = () => {
    if (!outcome) return;
    const res = run((s, actor, t) => {
      setSavedAt(t);
      return mode === "document"
        ? documentDose(s, actor.id, { doseId: view.id, outcome, reason, note, confirmed }, t)
        : correctRecord(s, actor.id, { recordId: view.record!.id, outcome, reason, note, correctionReason, confirmed }, t);
    });
    if (res.ok) setStep("done");
    else setError(res.error);
  };

  const header = (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
      <Avatar name={`${r.firstName} ${r.lastName}`} id={r.id} />
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold">
          {r.firstName} {r.lastName} {r.preferredName && <span className="font-normal text-slate-600">“{r.preferredName}”</span>}
        </div>
        <div className="text-slate-600">
          Room {r.room} · Born {r.birthYear}
        </div>
      </div>
      <StatusBadge status={view.status} dueNow={view.dueNow} />
      {r.allergies.length > 0 ? (
        <div className="w-full rounded-lg border-2 border-red-600 bg-red-50 px-3 py-1.5 font-bold text-red-800">
          <AlertTriangle className="mr-1 inline h-5 w-5" aria-hidden /> Allergies: {r.allergies.join(", ")}
        </div>
      ) : (
        <div className="w-full text-sm text-slate-600">No known allergies recorded (fictional)</div>
      )}
    </div>
  );

  if (step === "done") {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-700" aria-hidden />
        <h3 className="mt-2 text-2xl font-bold">{mode === "document" ? "Demo record saved" : "Correction saved"}</h3>
        <p className="mt-1 text-slate-700">
          {OUTCOME_LABEL[outcome!]} · {view.order.name} · {r.firstName} {r.lastName}
          <br />
          Recorded by {user.name} at {savedAt ? fmtDateTime(savedAt) : ""}. Added to the audit trail.
        </p>
        <Button className="mt-5" size="lg" onClick={onClose}>
          Back to med pass
        </Button>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div>
        {header}
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Detail label="Medication" value={`${view.order.name} ${view.order.strength} (${view.order.form})`} />
          <Detail label="Dose & route (from order on file)" value={`${view.order.dose} · ${view.order.route}`} />
          <Detail label="Scheduled" value={`${fmtDateTime(view.scheduledAt)} (${relative(view.scheduledAt, now)})`} />
          <Detail label="Indication" value={view.order.indication || "—"} />
          <Detail label="Instructions" value={view.order.instructions || "—"} wide />
          <Detail label="Prescriber (fictional)" value={view.order.prescriber} />
          <Detail label="Order status" value={view.order.status === "active" ? "Active" : "Discontinued"} />
        </dl>

        {view.history.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 font-bold">Documentation history (append-only)</h3>
            <ol className="space-y-2">
              {view.history.map((h) => {
                const superseded = view.history.some((x) => x.supersedesId === h.id);
                return (
                  <li key={h.id} className={cx("rounded-xl border p-3", superseded ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-300")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx("font-bold", superseded && "line-through")}>{OUTCOME_LABEL[h.outcome]}</span>
                      {h.reason && <span>— {h.reason}</span>}
                      {superseded && <span className="rounded bg-slate-200 px-2 text-sm font-semibold">Superseded by correction</span>}
                      {h.supersedesId && <span className="rounded bg-blue-100 px-2 text-sm font-semibold text-blue-900">Correction</span>}
                    </div>
                    <div className="text-sm">
                      {staffName(h.staffId)} · {fmtDateTime(h.recordedAt)}
                    </div>
                    {h.note && <div className="mt-1">Note: {h.note}</div>}
                    {h.correctionReason && <div className="mt-1">Correction reason: {h.correctionReason}</div>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {view.reviews.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 font-bold">Supervisor review</h3>
            {view.reviews.map((rv) => (
              <p key={rv.id} className="rounded-xl bg-blue-50 p-3">
                <b>{rv.action === "escalated" ? `Escalated to ${rv.escalatedTo}` : "Acknowledged"}</b> by {staffName(rv.reviewerId)}, {fmtDateTime(rv.at)}: {rv.note}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {!view.record && (
            <Button
              size="lg"
              disabled={!allowed || tooEarly || view.order.status !== "active" || !r.active}
              onClick={() => {
                setMode("document");
                setStep("outcome");
              }}
            >
              Document this dose
            </Button>
          )}
          {view.record && canCorrect && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setMode("correct");
                setStep("outcome");
              }}
            >
              Correct record
            </Button>
          )}
        </div>
        {!view.record && !allowed && <p className="mt-2 text-right text-slate-600">You are not assigned to this resident.</p>}
        {!view.record && tooEarly && <p className="mt-2 text-right text-slate-600">Documentation opens 2 hours before the scheduled time.</p>}
      </div>
    );
  }

  if (step === "outcome") {
    return (
      <div>
        {header}
        {mode === "correct" && (
          <div className="mb-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-3">
            <b>Correction mode.</b> The current record ({OUTCOME_LABEL[view.record!.outcome]}) will be kept and marked as superseded. Your entry is added as a new record.
          </div>
        )}
        <fieldset>
          <legend className="mb-2 text-lg font-bold">What happened with this dose?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {OUTCOMES.map((o) => {
              const st = OUTCOME_STYLE[o];
              const Icon = st.icon;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={outcome === o}
                  onClick={() => {
                    setOutcome(o);
                    setReason("");
                    setError(null);
                  }}
                  className={cx("flex min-h-20 items-center gap-3 rounded-2xl border-[3px] bg-white p-4 text-left", st.cls)}
                >
                  <Icon className="h-8 w-8 shrink-0" aria-hidden />
                  <span>
                    <span className="block text-xl font-bold">{OUTCOME_LABEL[o]}</span>
                    <span className="block text-sm opacity-90">{st.help}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        {needsReason && (
          <div className="mt-4">
            <label htmlFor="reason" className="mb-1 block font-bold">
              Reason (required)
            </label>
            <select id="reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Select a reason…</option>
              {REASONS[outcome as Exclude<Outcome, "administered">].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-4">
          <label htmlFor="note" className="mb-1 block font-bold">
            Note {reason.startsWith("Other") ? "(required)" : "(optional)"}
          </label>
          <textarea id="note" rows={2} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observations relevant to documentation…" />
        </div>
        {mode === "correct" && (
          <div className="mt-4">
            <label htmlFor="creason" className="mb-1 block font-bold">
              Why is this record being corrected? (required)
            </label>
            <input id="creason" className={inputCls} value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="e.g. Documented on the wrong row" />
          </div>
        )}
        <ErrorNote error={error} />
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={() => setStep("details")}>
            Back
          </Button>
          <Button size="lg" disabled={!outcomeValid} onClick={() => setStep("confirm")}>
            Review &amp; confirm
          </Button>
        </div>
      </div>
    );
  }

  // confirm
  return (
    <div>
      <div className="rounded-2xl border-[3px] border-brand-700 bg-brand-50 p-4">
        <h3 className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="h-6 w-6" aria-hidden /> Confirm {mode === "document" ? "documentation" : "correction"}
        </h3>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <Detail label="Resident" value={`${r.firstName} ${r.lastName} · Room ${r.room}`} />
          <Detail label="Medication" value={`${view.order.name} ${view.order.strength} — ${view.order.dose}, ${view.order.route}`} />
          <Detail label="Scheduled" value={`${fmtTime(view.scheduledAt)} on ${view.date}`} />
          <Detail label="Outcome" value={<span className="text-xl font-extrabold">{OUTCOME_LABEL[outcome!]}</span>} />
          {reason && <Detail label="Reason" value={reason} />}
          {note.trim() && <Detail label="Note" value={note.trim()} />}
          {mode === "correct" && <Detail label="Correction reason" value={correctionReason} />}
          <Detail label="Documented by (simulated identity)" value={`${user.name} — ${ROLE_LABEL[user.role]}`} />
          <Detail label="Timestamp" value="Set automatically when you save" />
        </dl>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-300 bg-white p-3">
        <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-brand-700" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span className="font-semibold">
          I confirm this {mode === "document" ? "entry" : "correction"} reflects what happened. I understand this is a demonstration record with fictional data.
        </span>
      </label>
      <ErrorNote error={error} />
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={() => setStep("outcome")}>
          Back
        </Button>
        <Button size="lg" variant="success" disabled={!confirmed} onClick={save}>
          Save demo record
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-lg text-slate-900">{value}</dd>
    </div>
  );
}
