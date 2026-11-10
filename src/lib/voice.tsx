"use client";
// Text-to-speech using the device's built-in voice (Web Speech API).
// No audio leaves the device; no API keys. Voice on/off is remembered per device.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { chunkForSpeech } from "./speech";

const PREF_KEY = "marcheck-voice-enabled";

interface VoiceCtx {
  supported: boolean;
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  /** Speaks if voice is on. Replaces anything currently being spoken. */
  speak: (text: string) => void;
  /** Replays the last message (even if it finished). */
  repeat: () => void;
  stop: () => void;
  lastMessage: string | null;
}

const Ctx = createContext<VoiceCtx>({
  supported: false,
  enabled: false,
  setEnabled: () => {},
  speak: () => {},
  repeat: () => {},
  stop: () => {},
  lastMessage: null,
});

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  const lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
  return (
    voices.find((v) => v.lang === lang && v.localService) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith("en") && v.localService) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(true);
  const [lastMessage, setLast] = useState<string | null>(null);
  const enabledRef = useRef(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth || typeof window.SpeechSynthesisUtterance === "undefined") return;
    setSupported(true);
    try {
      const saved = window.localStorage.getItem(PREF_KEY);
      if (saved !== null) {
        enabledRef.current = saved === "1";
        setEnabledState(saved === "1");
      }
    } catch {
      // storage unavailable: keep default (on)
    }
    const loadVoice = () => {
      voiceRef.current = pickVoice(synth);
    };
    loadVoice();
    synth.addEventListener?.("voiceschanged", loadVoice);
    // iOS Safari only allows speech after one call made inside a user gesture: prime it on the first tap.
    const prime = () => {
      try {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        synth.speak(u);
      } catch {
        // ignore
      }
    };
    window.addEventListener("pointerdown", prime, { once: true, capture: true });
    return () => {
      synth.removeEventListener?.("voiceschanged", loadVoice);
      window.removeEventListener("pointerdown", prime, { capture: true });
      synth.cancel();
    };
  }, []);

  const say = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    for (const chunk of chunkForSpeech(text)) {
      const u = new SpeechSynthesisUtterance(chunk);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.lang = voiceRef.current?.lang ?? "en-US";
      u.rate = 0.95;
      synth.speak(u);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      setLast(text);
      if (!supported || !enabledRef.current) return;
      say(text);
    },
    [supported, say],
  );

  const repeat = useCallback(() => {
    if (supported && lastMessage) say(lastMessage);
  }, [supported, lastMessage, say]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const setEnabled = useCallback(
    (on: boolean) => {
      enabledRef.current = on;
      setEnabledState(on);
      try {
        window.localStorage.setItem(PREF_KEY, on ? "1" : "0");
      } catch {
        // ignore
      }
      if (!supported) return;
      if (on) say("Voice read-out is on.");
      else window.speechSynthesis.cancel();
    },
    [supported, say],
  );

  return <Ctx.Provider value={{ supported, enabled, setEnabled, speak, repeat, stop, lastMessage }}>{children}</Ctx.Provider>;
}

export function useVoice() {
  return useContext(Ctx);
}
