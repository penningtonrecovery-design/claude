"use client";

import { useActionState } from "react";
import { REFLECTION_AREAS, SCALE_LABELS } from "@/lib/growth/reflection";
import { saveReflection } from "./actions";

export function ReflectionForm() {
  const [state, action, pending] = useActionState(saveReflection, undefined);

  return (
    <form action={action} className="space-y-5">
      {REFLECTION_AREAS.map((area) => (
        <fieldset key={area.key} className="rounded-2xl border border-line bg-ink-2 p-5 sm:p-6">
          <legend className="sr-only">{area.label}</legend>
          <p className="text-xs uppercase tracking-[0.2em] text-brass">{area.label}</p>
          <p className="mt-1 font-serif text-xl text-cream">{area.question}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="flex cursor-pointer flex-col items-center rounded-xl border border-line px-2 py-2.5 text-center transition hover:border-brass/60 has-[:checked]:border-brass has-[:checked]:bg-ink-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass-bright"
              >
                <input type="radio" name={area.key} value={n} className="sr-only" />
                <span className="font-serif text-xl text-cream">{n}</span>
                <span className="text-xs text-dust">{SCALE_LABELS[n]}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line px-2 py-2.5 text-sm text-dust transition hover:text-cream has-[:checked]:border-sand has-[:checked]:text-cream has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass-bright">
              <input type="radio" name={area.key} value="" defaultChecked className="sr-only" />
              Skip
            </label>
          </div>
          <label className="mt-4 block">
            <span className="sr-only">Anything you&apos;d add about {area.label.toLowerCase()}?</span>
            <input
              name={`${area.key}_note`}
              maxLength={500}
              placeholder="Anything you'd add? (optional)"
              className="w-full rounded-xl border border-line bg-ink px-4 py-2.5 text-cream placeholder:text-dust focus:border-brass focus:outline-none"
            />
          </label>
        </fieldset>
      ))}

      <section className="rounded-2xl border border-line bg-ink-2 p-5 sm:p-6">
        <label className="block">
          <span className="font-serif text-xl text-cream">What&apos;s one thing you&apos;re proud of this month?</span>
          <span className="mt-1 block text-sm text-dust">Big or small. Optional.</span>
          <textarea
            name="proud_of"
            maxLength={500}
            rows={3}
            className="mt-4 w-full rounded-xl border border-line bg-ink px-4 py-3 text-cream placeholder:text-dust focus:border-brass focus:outline-none"
          />
        </label>
      </section>

      {state?.error && (
        <p role="alert" className="rounded-xl border border-ember/60 bg-alert-bg px-4 py-3 text-sm text-alert">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="rounded-full bg-brass px-8 py-3.5 font-medium text-ink transition hover:bg-brass-bright disabled:opacity-60">
        {pending ? "Saving…" : "Save reflection"}
      </button>
    </form>
  );
}
