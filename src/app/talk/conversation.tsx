"use client";

import { useState, useTransition } from "react";
import type { CheckinNote } from "@/lib/checkins";
import type { SafetyLevel } from "@/lib/safety/classifier";
import { markCheckinSeen } from "./actions";
import { TextChat } from "./text-chat";
import { VoicePanel } from "./voice-panel";

type Mode = "voice" | "text";

export function Conversation({
  displayName,
  voiceConfigured,
  aiConfigured,
  memoryEnabled,
  resources,
  checkin,
}: {
  displayName: string | null;
  voiceConfigured: boolean;
  aiConfigured: boolean;
  memoryEnabled: boolean;
  resources: React.ReactNode;
  checkin: CheckinNote | null;
}) {
  const [mode, setMode] = useState<Mode>(voiceConfigured || !aiConfigured ? "voice" : "text");
  const [safety, setSafety] = useState<SafetyLevel>("none");
  const [note, setNote] = useState<CheckinNote | null>(checkin);
  const [opening, setOpening] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function closeCheckin(reply: boolean) {
    if (!note) return;
    const current = note;
    setNote(null);
    if (reply) {
      setOpening(current.text);
      setMode("text");
    }
    startTransition(() => markCheckinSeen(current.key));
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="flex justify-center px-4 pt-6">
        <div role="tablist" aria-label="Conversation mode" className="grid grid-cols-2 rounded-full border border-line p-1 text-sm">
          {(
            [
              ["voice", "Talk"],
              ["text", "Type"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-full px-6 py-2 transition ${mode === value ? "bg-ink-3 text-cream" : "text-dust hover:text-cream"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {note && (
        <section aria-label="Check-in" className="mx-4 mt-6 rounded-2xl border border-brass/40 bg-ink-2 p-5 sm:mx-6">
          <p className="font-serif text-xl leading-relaxed text-cream">{note.text}</p>
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={() => closeCheckin(true)} className="rounded-full bg-brass px-5 py-2 text-sm font-medium text-ink transition hover:bg-brass-bright">
              Reply
            </button>
            <button type="button" onClick={() => closeCheckin(false)} className="text-sm text-dust hover:text-cream">
              Thanks
            </button>
          </div>
        </section>
      )}

      {safety !== "none" && (
        <section aria-label="Support resources" className="mx-4 mt-6 rounded-2xl border border-ember/50 bg-ink-2 p-5 sm:mx-6">
          <h2 className="font-serif text-xl text-cream">
            {safety === "crisis" ? "Please reach out to someone right now." : "If it all feels like too much, help is here."}
          </h2>
          <p className="mb-4 mt-2 text-sm leading-relaxed text-sand">
            Real people are available any hour, free. Talking to them doesn&apos;t mean you have to stop talking here.
          </p>
          {resources}
        </section>
      )}

      {/* Both stay mounted so switching tabs doesn't drop a call or the chat. */}
      <div hidden={mode !== "voice"} className="flex-1">
        <VoicePanel configured={voiceConfigured} displayName={displayName} />
      </div>
      <div hidden={mode !== "text"} className="flex-1">
        <TextChat
          opening={opening}
          configured={aiConfigured}
          memoryEnabled={memoryEnabled}
          displayName={displayName}
          onSafety={(level) =>
            setSafety((current) => (rank(level) > rank(current) ? level : current))
          }
        />
      </div>
    </div>
  );
}

function rank(level: SafetyLevel) {
  return { none: 0, distress: 1, abuse: 2, crisis: 3 }[level];
}
