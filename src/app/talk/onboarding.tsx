"use client";

import { useActionState } from "react";
import { inputClass, Notice, primaryButtonClass } from "@/components/auth-shell";
import { completeOnboarding } from "./actions";

export function Onboarding() {
  const [state, formAction, pending] = useActionState(completeOnboarding, undefined);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm uppercase tracking-[0.2em] text-brass">Before we begin</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-cream">
        Glad you came. Let me tell you how this works.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-sand">
        Just a few things, and you can skip anything that&apos;s optional. You never have to
        tell me more than you want to.
      </p>

      <form action={formAction} className="mt-10 space-y-8">
        {state?.error && <Notice tone="error">{state.error}</Notice>}

        <section className="rounded-2xl border border-line bg-ink-2 p-6">
          <label className="block">
            <span className="font-serif text-xl text-cream">What should I call you?</span>
            <span className="mt-1 block text-sm text-dust">Optional. A first name or nickname is plenty.</span>
            <input name="displayName" maxLength={60} autoComplete="given-name" className={`${inputClass} mt-4`} placeholder="Skip if you'd rather not say" />
          </label>
        </section>

        <section className="rounded-2xl border border-line bg-ink-2 p-6">
          <h2 className="font-serif text-xl text-cream">Should I remember things between conversations?</h2>
          <p className="mt-2 leading-relaxed text-sand">
            If you say yes, you can save short notes (goals, what matters to you) that I&apos;ll
            keep in mind. Only notes you write and save are kept, and you can view or delete
            them any time in Settings. If you say no, nothing about our conversations is kept.
          </p>
          <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Memory</legend>
            {(
              [
                ["off", "Not now", "Start fresh each time."],
                ["on", "Yes, remember", "Only notes I choose to save."],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className="flex cursor-pointer gap-3 rounded-xl border border-line p-4 has-[:checked]:border-brass has-[:checked]:bg-ink-3">
                <input type="radio" name="memory" value={value} defaultChecked={value === "off"} className="mt-1 accent-[#c99a5b]" />
                <span>
                  <span className="block text-cream">{label}</span>
                  <span className="block text-sm text-dust">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-ink-2 p-6">
          <h2 className="font-serif text-xl text-cream">A couple of honest things</h2>
          <label className="flex gap-3">
            <input type="checkbox" name="confirmAdult" required className="mt-1 h-4 w-4 accent-[#c99a5b]" />
            <span className="leading-relaxed text-sand">I&apos;m 18 or older.</span>
          </label>
          <label className="flex gap-3">
            <input type="checkbox" name="acknowledgeLimits" required className="mt-1 h-4 w-4 accent-[#c99a5b]" />
            <span className="leading-relaxed text-sand">
              I understand Fatherly Friend is an AI, not a real person or a therapist, and
              isn&apos;t a crisis service. If I&apos;m ever in danger I&apos;ll call or text 988,
              or 911.
            </span>
          </label>
        </section>

        <button type="submit" disabled={pending} className={`${primaryButtonClass} sm:w-auto sm:px-10`}>
          {pending ? "Saving…" : "I'm ready"}
        </button>
      </form>
    </div>
  );
}
