"use client";

import { useState } from "react";
import type { SafetyLevel } from "@/lib/safety/classifier";
import { TextChat } from "./text-chat";
import { VoicePanel } from "./voice-panel";

type Mode = "voice" | "text";

export function Conversation({
  displayName,
  voiceConfigured,
  aiConfigured,
  resources,
}: {
  displayName: string | null;
  voiceConfigured: boolean;
  aiConfigured: boolean;
  resources: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>(voiceConfigured || !aiConfigured ? "voice" : "text");
  const [safety, setSafety] = useState<SafetyLevel>("none");

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
          configured={aiConfigured}
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
