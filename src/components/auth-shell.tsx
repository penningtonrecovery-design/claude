import type { ReactNode } from "react";
import { Wordmark, HelpNowLink } from "@/components/site-chrome";

export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="lamplight flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Wordmark />
        <HelpNowLink />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:pt-16">
        <div className="w-full max-w-md rounded-2xl border border-line bg-ink-2/90 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <h1 className="font-serif text-3xl text-cream">{title}</h1>
          {intro && <p className="mt-3 leading-relaxed text-sand">{intro}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-ink px-4 py-3 text-cream placeholder:text-dust focus:border-brass focus:outline-none";

export const primaryButtonClass =
  "w-full rounded-full bg-brass px-6 py-3 font-medium text-ink transition hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-60";

export function Notice({ tone, children }: { tone: "info" | "error"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "border-ember/60 bg-alert-bg text-alert"
      : "border-moss/40 bg-moss/10 text-cream";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {children}
    </p>
  );
}

export function NotConfigured() {
  return (
    <Notice tone="error">
      Sign-in isn&apos;t set up on this server yet. Add the Supabase settings to{" "}
      <code>.env.local</code> as described in the README, then restart the app.
    </Notice>
  );
}
