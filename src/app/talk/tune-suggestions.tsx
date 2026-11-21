"use client";

import { useState, useTransition } from "react";
import { describeSuggestion, MIN_USER_MESSAGES, type Suggestion } from "@/lib/personalization/suggest";
import { acceptSuggestion } from "@/app/settings/preference-actions";

type Message = { role: "user" | "assistant"; content: string };
type Status = "idle" | "loading" | "shown" | "none" | "not_now" | "limited" | "error";

// Lets him ask for style suggestions based on this conversation. The
// conversation is sent once for this request and not stored; nothing changes
// unless he accepts a suggestion.
export function TuneSuggestions({ messages, configured }: { messages: Message[]; configured: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [limitNote, setLimitNote] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [decided, setDecided] = useState<Record<number, "accepted" | "skipped">>({});
  const [saving, startSaving] = useTransition();

  const userCount = messages.filter((m) => m.role === "user").length;
  if (!configured || userCount < MIN_USER_MESSAGES) return null;

  async function ask() {
    setStatus("loading");
    setDecided({});
    try {
      const res = await fetch("/api/preferences/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-40) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && typeof data.message === "string") {
        setLimitNote(data.message);
        return setStatus("limited");
      }
      if (!res.ok) return setStatus("error");
      if (data.kind === "not_now") return setStatus("not_now");
      const list: Suggestion[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      setSuggestions(list);
      setStatus(list.length ? "shown" : "none");
    } catch {
      setStatus("error");
    }
  }

  if (status === "idle" || status === "loading") {
    return (
      <div className="mx-4 mb-3 sm:mx-6">
        <button
          type="button"
          onClick={ask}
          disabled={status === "loading"}
          className="text-sm text-brass-bright underline-offset-4 hover:underline disabled:opacity-60"
        >
          {status === "loading" ? "Thinking about how to talk with you…" : "Tune how he talks to me"}
        </button>
        <p className="mt-1 text-xs text-dust">Sends this conversation once to suggest settings. It isn&apos;t saved, and nothing changes unless you accept.</p>
      </div>
    );
  }

  return (
    <section aria-label="Suggested settings" className="mx-4 mb-3 rounded-xl border border-line bg-ink-2 p-4 sm:mx-6">
      {status === "shown" && (
        <>
          <p className="text-sm text-sand">Based on this conversation, you might like:</p>
          <ul className="mt-3 space-y-3">
            {suggestions.map((s, i) => (
              <li key={i} className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-cream">{describeSuggestion(s)}</p>
                  <p className="text-sm text-dust">{s.reason}</p>
                </div>
                {decided[i] ? (
                  <span className="text-sm text-dust">{decided[i] === "accepted" ? "Saved" : "Skipped"}</span>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        startSaving(async () => {
                          const r = await acceptSuggestion({ field: s.field, value: s.value });
                          if (!r.error) setDecided((d) => ({ ...d, [i]: "accepted" }));
                        })
                      }
                      className="rounded-full bg-brass px-4 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button type="button" onClick={() => setDecided((d) => ({ ...d, [i]: "skipped" }))} className="text-sm text-dust hover:text-cream">
                      Skip
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {status === "none" && <p className="text-sm text-sand">Nothing to change. The way you&apos;re talking now seems to suit you.</p>}
      {status === "not_now" && <p className="text-sm text-sand">Let&apos;s leave settings for another time and stay with what you&apos;re going through.</p>}
      {status === "limited" && <p className="text-sm text-sand">{limitNote}</p>}
      {status === "error" && <p className="text-sm text-sand">Suggestions aren&apos;t available right now. You can always adjust things in Settings.</p>}
      <button type="button" onClick={() => setStatus("idle")} className="mt-3 text-xs text-dust hover:text-cream">
        Close
      </button>
    </section>
  );
}
