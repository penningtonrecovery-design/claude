"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { MEMORY_CATEGORIES, MAX_MEMORY_CHARS, prefillFromMessage } from "@/lib/memory/save";
import type { SafetyLevel } from "@/lib/safety/classifier";
import { rememberFromChat } from "./actions";

type Message = { role: "user" | "assistant"; content: string };

const RANK: Record<SafetyLevel, number> = { none: 0, distress: 1, abuse: 2, crisis: 3 };

export function TextChat({
  opening,
  configured,
  memoryEnabled,
  displayName,
  onSafety,
}: {
  opening?: string | null;
  configured: boolean;
  memoryEnabled: boolean;
  displayName: string | null;
  onSafety: (level: SafetyLevel) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `${displayName ? `Hello, ${displayName}.` : "Hello there."} I'm glad you're here. There's no rush. What's on your mind today?`,
    },
  ]);
  // A check-in he chose to reply to joins the conversation as his next prompt,
  // keeping anything already said.
  const [shownOpening, setShownOpening] = useState<string | null>(null);
  if (opening && opening !== shownOpening) {
    setShownOpening(opening);
    setMessages((m) =>
      m.length === 1 && m[0].role === "assistant"
        ? [{ role: "assistant", content: opening }]
        : [...m, { role: "assistant", content: opening }],
    );
  }
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    configured ? null : "Text replies aren't configured on this server yet. Messages that mention being in danger still get help information.",
  );
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setDraft("");
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-40) }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.safety && RANK[data.safety as SafetyLevel] > 0) onSafety(data.safety);

      if (res.ok && data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        setNotice(null);
      } else if (res.status === 503) {
        setNotice("Text replies aren't configured on this server yet, so he can't answer this one.");
      } else if (res.status === 401) {
        setNotice("Your session has ended. Please sign in again.");
      } else {
        setNotice("He couldn't reply just now. Your message is still here; try sending again in a moment.");
        setMessages((m) => m.slice(0, -1));
        setDraft(content);
      }
    } catch {
      setNotice("You seem to be offline. Your message is still here; try again when you're connected.");
      setMessages((m) => m.slice(0, -1));
      setDraft(content);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex flex-col items-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-3 px-4 py-3 leading-relaxed text-cream">
                {m.content}
              </div>
              {memoryEnabled && <RememberThis text={m.content} onCrisis={() => onSafety("crisis")} />}
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] whitespace-pre-line font-serif text-lg leading-relaxed text-cream">
                {m.content}
              </div>
            </div>
          ),
        )}
        {pending && <p className="font-serif text-lg text-dust">…</p>}
        <div ref={endRef} />
      </div>

      {notice && (
        <p role="status" className="mx-4 mb-3 rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-sand sm:mx-6">
          {notice}
        </p>
      )}

      <form onSubmit={send} className="border-t border-line/60 p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-ink-2 p-2 focus-within:border-brass">
          <label htmlFor="message" className="sr-only">Your message</label>
          <textarea
            id="message"
            rows={1}
            maxLength={4000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Say whatever's on your mind…"
            className="max-h-40 min-h-[44px] flex-1 resize-y bg-transparent px-3 py-2.5 text-cream placeholder:text-dust focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="rounded-xl bg-brass px-5 py-2.5 font-medium text-ink transition hover:bg-brass-bright disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-2 px-1 text-xs text-dust">
          {memoryEnabled
            ? "Conversations aren't saved, only what you choose to remember."
            : "Not saved by the app."}{" "}
          Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}

const CATEGORY_LABELS: Record<(typeof MEMORY_CATEGORIES)[number], string> = {
  goal: "Goal",
  experience: "Experience",
  preference: "Preference",
  challenge: "Challenge",
  achievement: "Achievement",
  other: "Other",
};

// Lets him save something he said, in his own (editable) words. Nothing is
// stored until he taps Save.
function RememberThis({ text, onCrisis }: { text: string; onCrisis: () => void }) {
  const [state, setState] = useState<"idle" | "editing" | "saved">("idle");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<(typeof MEMORY_CATEGORIES)[number]>("other");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state === "saved") {
    return (
      <p className="mt-1.5 text-xs text-moss" role="status">
        Saved to memory. <a href="/settings" className="underline underline-offset-2">Review in Settings</a>
      </p>
    );
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => {
          setContent(prefillFromMessage(text));
          setState("editing");
        }}
        className="mt-1.5 text-xs text-dust transition hover:text-brass-bright"
      >
        Remember this
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await rememberFromChat(category, content);
          if (result.ok) setState("saved");
          else {
            setError(result.error);
            if (result.crisis) onCrisis();
          }
        });
      }}
      className="mt-2 w-full max-w-[85%] space-y-2 rounded-xl border border-line bg-ink-2 p-3"
    >
      <label className="block">
        <span className="mb-1 block text-xs text-dust">What should he remember? Edit it however you like.</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_MEMORY_CHARS}
          rows={2}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-brass focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label>
          <span className="sr-only">Kind of memory</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof MEMORY_CATEGORIES)[number])}
            className="rounded-lg border border-line bg-ink px-2 py-1.5 text-sm text-cream"
          >
            {MEMORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending || !content.trim()} className="rounded-full bg-brass px-4 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setState("idle")} className="text-sm text-dust hover:text-cream">Cancel</button>
      </div>
      {error && <p role="alert" className="text-sm text-alert">{error}</p>}
    </form>
  );
}
