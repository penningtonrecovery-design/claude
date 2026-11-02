"use client";

import { useActionState } from "react";
import { inputClass, Notice } from "@/components/auth-shell";
import { CHECKIN_FREQUENCIES, FREQUENCY_LABELS, type CheckinFrequency } from "@/lib/checkins";
import { addMemory, deleteAccount, setCheckinFrequency, updateDisplayName } from "./actions";

const smallButton =
  "rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass-bright disabled:opacity-60";

export function DisplayNameForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState(updateDisplayName, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">What he calls you</span>
          <input name="displayName" defaultValue={current ?? ""} maxLength={60} className={inputClass} placeholder="Leave blank for no name" />
        </label>
        <button type="submit" disabled={pending} className={smallButton}>Save</button>
      </div>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && <Notice tone="info">{state.ok}</Notice>}
    </form>
  );
}

export function AddMemoryForm() {
  const [state, action, pending] = useActionState(addMemory, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <label>
          <span className="sr-only">Kind of note</span>
          <select name="category" defaultValue="goal" className={inputClass}>
            <option value="goal">Goal</option>
            <option value="experience">Experience</option>
            <option value="preference">Preference</option>
            <option value="challenge">Challenge</option>
            <option value="achievement">Achievement</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Note</span>
          <textarea name="content" required maxLength={500} rows={2} className={inputClass} placeholder="e.g. I want to be more patient with my son." />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={smallButton}>Save note</button>
        {state?.ok && <span className="text-sm text-moss">{state.ok}</span>}
      </div>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm text-sand">Type DELETE to permanently remove your account, profile, memories, plans and reflections.</span>
        <input name="confirm" autoComplete="off" className={inputClass} />
      </label>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <button type="submit" disabled={pending} className="rounded-full border border-ember/70 px-5 py-2.5 text-sm text-alert transition hover:bg-alert-bg disabled:opacity-60">
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}

export function CheckinForm({ current }: { current: CheckinFrequency }) {
  const [state, action, pending] = useActionState(setCheckinFrequency, undefined);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">How often</legend>
        {CHECKIN_FREQUENCIES.map((f) => (
          <label
            key={f}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-brass has-[:checked]:bg-ink-3"
          >
            <input type="radio" name="frequency" value={f} defaultChecked={f === current} className="accent-[#c99a5b]" />
            <span className="text-cream">{FREQUENCY_LABELS[f]}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={smallButton}>Save</button>
        {state?.ok && <span className="text-sm text-moss">{state.ok}</span>}
      </div>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
    </form>
  );
}
