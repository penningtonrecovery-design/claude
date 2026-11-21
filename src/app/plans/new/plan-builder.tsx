"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LIBRARY, MAX_FOCUS_CHARS, MAX_PLAN_STEPS, TOPICS, type Topic } from "@/lib/growth/library";
import { createPlan } from "../actions";

type Suggestion = { content: string; source: "library" | "ai" | "user"; selected: boolean };

function librarySuggestions(topic: Topic): Suggestion[] {
  return LIBRARY[topic].steps.map((content, i) => ({ content, source: "library", selected: i < 3 }));
}

export function PlanBuilder({ aiConfigured, resources }: { aiConfigured: boolean; resources: React.ReactNode }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [focus, setFocus] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [tailoring, setTailoring] = useState(false);
  const [tailorNote, setTailorNote] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const selected = suggestions.filter((s) => s.selected && s.content.trim());

  function chooseTopic(t: Topic) {
    setTopic(t);
    setSuggestions(librarySuggestions(t));
    setTailorNote(null);
    setCrisis(false);
  }

  function update(i: number, patch: Partial<Suggestion>) {
    setSuggestions((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function tailor() {
    if (!topic) return;
    setTailoring(true);
    setTailorNote(null);
    try {
      const res = await fetch("/api/plans/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, focus }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "crisis") {
        setCrisis(true);
      } else if (res.ok && Array.isArray(data.steps)) {
        setSuggestions([
          ...data.steps.map((content: string) => ({ content, source: "ai" as const, selected: true })),
          ...librarySuggestions(topic).map((s) => ({ ...s, selected: false })),
        ]);
        setTailorNote("Here's what he suggests, with the starter steps below. Change anything.");
      } else if (res.status === 503) {
        setTailorNote("Tailoring isn't configured on this server yet. The starter steps are ready to use.");
      } else {
        setTailorNote("He couldn't put suggestions together just now. The starter steps are ready to use.");
      }
    } catch {
      setTailorNote("You seem to be offline. The starter steps are ready to use.");
    } finally {
      setTailoring(false);
    }
  }

  function save() {
    if (!topic) return;
    setError(null);
    startSaving(async () => {
      const result = await createPlan({
        topic,
        focus,
        steps: selected.map((s) => ({ content: s.content.trim(), source: s.source })),
      });
      if (result?.error) setError(result.error);
    });
  }

  if (!topic) {
    return (
      <div>
        <h1 className="font-serif text-4xl text-cream">What would you like to grow in?</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-sand">Pick one. You can always start another plan later.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => chooseTopic(t)}
              className="rounded-2xl border border-line bg-ink-2 p-5 text-left transition hover:border-brass/60"
            >
              <span className="block font-serif text-xl text-cream">{LIBRARY[t].label}</span>
              <span className="mt-1 block text-sm leading-relaxed text-sand">{LIBRARY[t].blurb}</span>
            </button>
          ))}
        </div>
        <p className="mt-8">
          <Link href="/plans" className="text-dust hover:text-cream">Not now</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <button type="button" onClick={() => setTopic(null)} className="text-sm text-dust hover:text-cream">
          ← Choose a different topic
        </button>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-brass">{LIBRARY[topic].label}</p>
        <h1 className="mt-2 font-serif text-4xl text-cream">Let&apos;s keep it small.</h1>
      </div>

      <section className="rounded-2xl border border-line bg-ink-2 p-6">
        <label className="block">
          <span className="font-serif text-xl text-cream">What would you like to work on?</span>
          <span className="mt-1 block text-sm text-dust">Optional. A sentence is plenty, and you don&apos;t need to explain why.</span>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            maxLength={MAX_FOCUS_CHARS}
            rows={2}
            placeholder="e.g. Speaking up in meetings without second-guessing myself"
            className="mt-4 w-full rounded-xl border border-line bg-ink px-4 py-3 text-cream placeholder:text-dust focus:border-brass focus:outline-none"
          />
        </label>
        {aiConfigured && (
          <button
            type="button"
            onClick={tailor}
            disabled={tailoring}
            className="mt-4 rounded-full border border-brass/60 px-5 py-2.5 text-sm text-brass-bright transition hover:bg-ink-3 disabled:opacity-60"
          >
            {tailoring ? "He's thinking…" : "Ask Fatherly Friend to tailor the steps"}
          </button>
        )}
      </section>

      {crisis && (
        <section aria-label="Support resources" className="rounded-2xl border border-ember/50 bg-ink-2 p-5">
          <h2 className="font-serif text-xl text-cream">That sounds like a lot to carry. Are you safe right now?</h2>
          <p className="mb-4 mt-2 text-sm leading-relaxed text-sand">
            A plan can wait. A real person can help right now, any hour, for free.
          </p>
          {resources}
        </section>
      )}

      <section>
        <h2 className="font-serif text-2xl text-cream">Choose up to {MAX_PLAN_STEPS} steps</h2>
        <p className="mt-1 text-sm text-dust">Tick the ones that fit. Edit the words so they sound like you.</p>
        {tailorNote && <p role="status" className="mt-3 text-sm text-sand">{tailorNote}</p>}
        <ul className="mt-4 space-y-3">
          {suggestions.map((s, i) => (
            <li key={i} className={`flex gap-3 rounded-xl border p-3 transition ${s.selected ? "border-brass/60 bg-ink-3" : "border-line bg-ink-2"}`}>
              <input
                type="checkbox"
                checked={s.selected}
                disabled={!s.selected && selected.length >= MAX_PLAN_STEPS}
                onChange={(e) => update(i, { selected: e.target.checked })}
                aria-label="Include this step"
                className="mt-2 h-5 w-5 shrink-0 accent-[#c99a5b]"
              />
              <div className="flex-1">
                <textarea
                  value={s.content}
                  onChange={(e) => update(i, { content: e.target.value })}
                  maxLength={280}
                  rows={2}
                  aria-label="Step"
                  className="w-full resize-y bg-transparent leading-relaxed text-cream focus:outline-none"
                />
                {s.source === "ai" && <span className="text-xs text-brass">Suggested for you</span>}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setSuggestions((list) => [...list, { content: "", source: "user", selected: selected.length < MAX_PLAN_STEPS }])}
          className="mt-3 text-sm text-brass-bright hover:underline"
        >
          + Write your own step
        </button>
      </section>

      {error && <p role="alert" className="rounded-xl border border-ember/60 bg-alert-bg px-4 py-3 text-sm text-alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || selected.length === 0}
          className="rounded-full bg-brass px-8 py-3.5 font-medium text-ink transition hover:bg-brass-bright disabled:opacity-50"
        >
          {saving ? "Saving…" : `Start this plan (${selected.length} step${selected.length === 1 ? "" : "s"})`}
        </button>
        <Link href="/plans" className="text-dust hover:text-cream">Not now</Link>
      </div>
    </div>
  );
}
