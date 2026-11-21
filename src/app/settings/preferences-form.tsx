"use client";

import { useActionState } from "react";
import { Notice } from "@/components/auth-shell";
import {
  AVOID_TOPICS,
  FAITH_OPTIONS,
  FOCUSES,
  LABELS,
  LIFE_CONTEXT,
  NEXT_STEP_FREQUENCIES,
  TONES,
  type Preferences,
} from "@/lib/personalization/preferences";
import { savePreferences } from "./preference-actions";

const chip =
  "cursor-pointer rounded-full border border-line px-4 py-2 text-sm text-sand transition hover:border-brass/60 has-[:checked]:border-brass has-[:checked]:bg-ink-3 has-[:checked]:text-cream has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass-bright";

function Choice<T extends string>({
  name,
  legend,
  options,
  labels,
  current,
}: {
  name: string;
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  current: T;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-cream">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className={chip}>
            <input type="radio" name={name} value={o} defaultChecked={current === o} className="sr-only" />
            {labels[o]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Many<T extends string>({
  name,
  legend,
  hint,
  options,
  labels,
  current,
}: {
  name: string;
  legend: string;
  hint?: string;
  options: readonly T[];
  labels: Record<T, string>;
  current: T[];
}) {
  return (
    <fieldset>
      <legend className="text-sm text-cream">{legend}</legend>
      {hint && <p className="mb-2 mt-0.5 text-xs text-dust">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className={chip}>
            <input type="checkbox" name={name} value={o} defaultChecked={current.includes(o)} className="sr-only" />
            {labels[o]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PreferencesForm({ prefs, memoryOn }: { prefs: Preferences; memoryOn: boolean }) {
  const [state, action, pending] = useActionState(savePreferences, undefined);
  return (
    <form action={action} className="space-y-6">
      <Choice name="tone" legend="How should he come across?" options={TONES} labels={LABELS.tone} current={prefs.tone} />
      <Choice name="focus" legend="What helps you most?" options={FOCUSES} labels={LABELS.focus} current={prefs.focus} />
      <Choice name="nextSteps" legend="How often should he suggest a next step?" options={NEXT_STEP_FREQUENCIES} labels={LABELS.nextSteps} current={prefs.nextSteps} />
      <Choice name="faith" legend="Faith and spirituality" options={FAITH_OPTIONS} labels={LABELS.faith} current={prefs.faith} />
      <Many
        name="avoidTopics"
        legend="Topics he shouldn't bring up unless you do"
        options={AVOID_TOPICS}
        labels={LABELS.avoidTopics}
        current={prefs.avoidTopics}
      />
      <Many
        name="lifeContext"
        legend="A little about your life (optional)"
        hint={memoryOn ? "He keeps this in mind because memory is on." : "Saved, but only shared with him while memory is on."}
        options={LIFE_CONTEXT}
        labels={LABELS.lifeContext}
        current={prefs.lifeContext}
      />
      <p className="text-xs leading-relaxed text-dust">
        These shape how he talks, never his safety rules. If you&apos;re ever in danger he&apos;ll always point you to help.
      </p>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass-bright disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        {state?.ok && <span className="text-sm text-moss">{state.ok}</span>}
      </div>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
    </form>
  );
}
