"use client";

import { useEffect, useRef, useState } from "react";
import type { WebCallSession } from "retell-client-js-sdk";

type Status = "idle" | "connecting" | "live" | "ended" | "error";

type RetellModule = typeof import("retell-client-js-sdk");

// The SDK talks to api.retellai.com by default. We send its one request,
// create-web-call, to our own route instead, which adds the real key and
// agent. Anything else the SDK tries to call is refused.
function proxiedFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const path = new URL(String(url)).pathname;
  if (path !== "/v3/create-web-call") {
    return Promise.reject(new Error(`Blocked voice request to ${path}`));
  }
  const headers = new Headers(init?.headers);
  headers.delete("Authorization");
  return fetch("/api/voice/web-call", { ...init, headers, credentials: "same-origin" });
}

export function VoicePanel({ configured, displayName }: { configured: boolean; displayName: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<WebCallSession | null>(null);
  const moduleRef = useRef<RetellModule | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  // Load the SDK ahead of time so starting a call stays inside the click,
  // which browsers require for microphone and audio playback.
  useEffect(() => {
    if (!configured) return;
    import("retell-client-js-sdk").then((m) => (moduleRef.current = m)).catch(() => {});
  }, [configured]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      sessionRef.current?.end().catch(() => {});
    };
  }, []);

  function animateOrb() {
    const volume = sessionRef.current?.analyzerComponent?.calculateVolume() ?? 0;
    orbRef.current?.style.setProperty("--level", String(Math.min(1, volume * 4)));
    frameRef.current = requestAnimationFrame(animateOrb);
  }

  function stopAnimation() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    orbRef.current?.style.setProperty("--level", "0");
  }

  async function start() {
    setError(null);
    setMuted(false);
    setStatus("connecting");
    try {
      const mod = moduleRef.current ?? (await import("retell-client-js-sdk"));
      const client = new mod.RetellClient({ key: "held-by-server", fetch: proxiedFetch });
      const session = client.createWebCall({
        agent_id: "assigned-by-server",
        hooks: {
          onStatus: (s) => {
            if (s === "live") {
              setStatus("live");
              animateOrb();
            }
          },
          onEnd: () => {
            stopAnimation();
            setStatus("ended");
            sessionRef.current = null;
          },
          onError: (err) => {
            stopAnimation();
            setStatus("error");
            setError(describeError(err));
            sessionRef.current = null;
          },
        },
      });
      sessionRef.current = session;
      await session.ready;
    } catch (err) {
      stopAnimation();
      setStatus("error");
      setError(describeError(err));
    }
  }

  async function end() {
    await sessionRef.current?.end().catch(() => {});
    sessionRef.current = null;
    stopAnimation();
    setStatus("ended");
  }

  function toggleMute() {
    const session = sessionRef.current;
    if (!session) return;
    if (muted) session.unmute();
    else session.mute();
    setMuted(!muted);
  }

  const live = status === "live";

  return (
    <div className="flex flex-col items-center px-4 py-10 text-center sm:py-14">
      <div
        ref={orbRef}
        aria-hidden
        style={{ ["--level" as string]: 0 }}
        className={`relative grid h-44 w-44 place-items-center rounded-full sm:h-52 sm:w-52 ${live ? "" : "animate-breathe"}`}
      >
        <div
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,#ddb174_0%,#b5653b_45%,#3a2418_75%,transparent_76%)] opacity-80 transition-transform duration-100"
          style={{ transform: "scale(calc(1 + var(--level) * 0.12))" }}
        />
        <div
          className="absolute -inset-6 rounded-full bg-brass/20 blur-2xl transition-opacity duration-100"
          style={{ opacity: "calc(0.35 + var(--level) * 0.65)" }}
        />
        <span className="relative font-serif text-5xl text-ink/80">F</span>
      </div>

      <h2 className="mt-8 font-serif text-2xl text-cream sm:text-3xl" aria-live="polite">
        {status === "idle" && (displayName ? `Ready when you are, ${displayName}.` : "Ready when you are.")}
        {status === "connecting" && "Connecting…"}
        {status === "live" && (muted ? "Paused. He can't hear you." : "He's listening.")}
        {status === "ended" && "Conversation ended."}
        {status === "error" && "That didn't connect."}
      </h2>

      <p className="mt-3 max-w-md leading-relaxed text-sand">
        {!configured
          ? "Voice isn't configured on this server yet. You can use text in the meantime."
          : status === "live"
            ? "Speak naturally. You can interrupt him any time, just start talking."
            : "Your browser will ask to use your microphone. Audio is processed by our voice provider to hold the conversation."}
      </p>

      {error && <p role="alert" className="mt-4 max-w-md rounded-xl border border-ember/60 bg-alert-bg px-4 py-3 text-sm text-alert">{error}</p>}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {!live && status !== "connecting" && (
          <button
            type="button"
            onClick={start}
            disabled={!configured}
            className="rounded-full bg-brass px-8 py-3.5 font-medium text-ink transition hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "ended" || status === "error" ? "Talk again" : "Start talking"}
          </button>
        )}
        {(live || status === "connecting") && (
          <>
            <button type="button" onClick={toggleMute} disabled={!live} className="rounded-full border border-line px-6 py-3 text-cream transition hover:border-brass/60 disabled:opacity-50">
              {muted ? "Resume" : "Pause"}
            </button>
            <button type="button" onClick={end} className="rounded-full border border-ember/70 px-6 py-3 text-alert transition hover:bg-alert-bg">
              End conversation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/permission|notallowed|denied/i.test(message)) {
    return "Microphone access was blocked. Allow it in your browser's site settings and try again.";
  }
  if (/sign in/i.test(message)) return "Your session has ended. Please sign in again.";
  if (/not configured/i.test(message)) return "Voice isn't configured on this server yet.";
  return "We couldn't start the voice conversation. Please try again in a moment, or use text.";
}
