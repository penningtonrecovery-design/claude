"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  addStep,
  deletePlan,
  deleteStep,
  saveStepNote,
  setPlanStatus,
  setStepDone,
  updateStepContent,
} from "./actions";

export type PlanView = {
  id: string;
  label: string;
  focus: string | null;
  status: "active" | "completed" | "archived";
  createdAt: string;
  steps: { id: string; content: string; doneAt: string | null; note: string | null; source: string }[];
};

const quietButton = "text-sm text-dust transition hover:text-cream disabled:opacity-50";

export function PlanCard({ plan, maxSteps }: { plan: PlanView; maxSteps: number }) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newStep, setNewStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const done = plan.steps.filter((s) => s.doneAt).length;
  const total = plan.steps.length;
  const active = plan.status === "active";

  function run(fn: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  return (
    <article className={`rounded-2xl border border-line bg-ink-2 p-5 sm:p-6 ${pending ? "opacity-80" : ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brass">{plan.label}</p>
          {plan.focus && <h3 className="mt-1 font-serif text-xl text-cream">{plan.focus}</h3>}
        </div>
        <p className="text-sm text-dust">
          {done} of {total} done
        </p>
      </header>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-3" aria-hidden>
        <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <ol className="mt-5 space-y-3">
        {plan.steps.map((step) => (
          <StepRow key={step.id} step={step} editable={active} run={run} />
        ))}
      </ol>

      {error && <p role="alert" className="mt-3 text-sm text-alert">{error}</p>}

      {active && total < maxSteps && (
        <div className="mt-4">
          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const r = await addStep(plan.id, newStep);
                  if (!r.error) {
                    setNewStep("");
                    setAdding(false);
                  }
                  return r;
                });
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                maxLength={280}
                autoFocus
                placeholder="A small step you'd like to add"
                className="flex-1 rounded-xl border border-line bg-ink px-4 py-2.5 text-cream placeholder:text-dust focus:border-brass focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright">Add</button>
              <button type="button" onClick={() => setAdding(false)} className={quietButton}>Cancel</button>
            </form>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="text-sm text-brass-bright hover:underline">
              + Add your own step
            </button>
          )}
        </div>
      )}

      <footer className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line/60 pt-4">
        {active ? (
          <>
            <button type="button" disabled={pending} className={quietButton} onClick={() => run(() => setPlanStatus(plan.id, "completed"))}>
              Mark plan complete
            </button>
            <button type="button" disabled={pending} className={quietButton} onClick={() => run(() => setPlanStatus(plan.id, "archived"))}>
              Set aside for now
            </button>
          </>
        ) : (
          <button type="button" disabled={pending} className={quietButton} onClick={() => run(() => setPlanStatus(plan.id, "active"))}>
            Pick this back up
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          className="text-sm text-dust transition hover:text-alert"
          onClick={() => {
            if (window.confirm("Delete this plan and its notes? This can't be undone.")) run(() => deletePlan(plan.id));
          }}
        >
          Delete
        </button>
      </footer>
    </article>
  );
}

function StepRow({
  step,
  editable,
  run,
}: {
  step: PlanView["steps"][number];
  editable: boolean;
  run: (fn: () => Promise<{ error?: string } | void>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(step.content);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(step.note ?? "");
  const [done, setOptimisticDone] = useOptimistic(Boolean(step.doneAt));

  return (
    <li className="rounded-xl border border-line/70 bg-ink/60 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          disabled={!editable}
          onChange={(e) => {
            const checked = e.target.checked;
            run(async () => {
              setOptimisticDone(checked);
              await setStepDone(step.id, checked);
            });
          }}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className="mt-1 h-5 w-5 shrink-0 accent-[#9aa878]"
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const r = await updateStepContent(step.id, text);
                  if (!r.error) setEditing(false);
                  return r;
                });
              }}
              className="space-y-2"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={280}
                rows={2}
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-cream focus:border-brass focus:outline-none"
              />
              <div className="flex gap-3">
                <button type="submit" className="text-sm text-brass-bright">Save</button>
                <button type="button" className={quietButton} onClick={() => { setText(step.content); setEditing(false); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <p className={`leading-relaxed ${done ? "text-dust line-through decoration-dust/50" : "text-cream"}`}>{step.content}</p>
          )}

          {step.note && !noteOpen && <p className="mt-2 border-l-2 border-brass/40 pl-3 text-sm italic text-sand">{step.note}</p>}

          {noteOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const r = await saveStepNote(step.id, note);
                  if (!r.error) setNoteOpen(false);
                  return r;
                });
              }}
              className="mt-2 space-y-2"
            >
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="How did it go? What did you notice?"
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-cream placeholder:text-dust focus:border-brass focus:outline-none"
              />
              <div className="flex gap-3">
                <button type="submit" className="text-sm text-brass-bright">Save note</button>
                <button type="button" className={quietButton} onClick={() => setNoteOpen(false)}>Cancel</button>
              </div>
            </form>
          )}

          {editable && !editing && !noteOpen && (
            <div className="mt-2 flex flex-wrap gap-4">
              <button type="button" className={quietButton} onClick={() => setNoteOpen(true)}>
                {step.note ? "Edit note" : "Add a note"}
              </button>
              <button type="button" className={quietButton} onClick={() => setEditing(true)}>Edit step</button>
              <button type="button" className="text-sm text-dust hover:text-alert" onClick={() => run(() => deleteStep(step.id))}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
