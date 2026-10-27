"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { SafetyLevel } from "@/lib/safety/classifier";

type Message = { role: "user" | "assistant"; content: string };

const RANK: Record<SafetyLevel, number> = { none: 0, distress: 1, abuse: 2, crisis: 3 };

export function TextChat({
  configured,
  displayName,
  onSafety,
}: {
  configured: boolean;
  displayName: string | null;
  onSafety: (level: SafetyLevel) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `${displayName ? `Hello, ${displayName}.` : "Hello there."} I'm glad you're here. There's no rush. What's on your mind today?`,
    },
  ]);
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
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-ink-3 px-4 py-3 leading-relaxed text-cream"
                  : "max-w-[85%] whitespace-pre-line font-serif text-lg leading-relaxed text-cream"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
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
        <p className="mt-2 px-1 text-xs text-dust">Not saved by the app. Enter to send, Shift+Enter for a new line.</p>
      </form>
    </div>
  );
}
