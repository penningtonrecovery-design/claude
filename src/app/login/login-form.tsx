"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { inputClass, Notice, NotConfigured, primaryButtonClass } from "@/components/auth-shell";
import { safeNextPath } from "@/lib/auth/redirect";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type Mode = "link" | "password";
type PasswordAction = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const linkError = params.get("error") === "link";

  const [mode, setMode] = useState<Mode>("link");
  const [action, setAction] = useState<PasswordAction>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError ? "That sign-in link has expired or was already used. Request a new one below." : null,
  );
  const [sent, setSent] = useState<string | null>(null);

  if (!supabaseConfigured) return <NotConfigured />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    setBusy(true);
    setError(null);
    setSent(null);

    try {
      if (mode === "link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: callbackUrl, shouldCreateUser: true },
        });
        if (error) throw error;
        setSent(`We sent a sign-in link to ${email}. Open it on this device to continue.`);
      } else if (action === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else {
          setSent(`Check ${email} for a link to confirm your address, then you're in.`);
        }
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 rounded-full border border-line p-1 text-sm">
        {(
          [
            ["link", "Email me a link"],
            ["password", "Use a password"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
              setSent(null);
            }}
            className={`rounded-full px-3 py-2 transition ${
              mode === value ? "bg-ink-3 text-cream" : "text-dust hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {sent && <Notice tone="info">{sent}</Notice>}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-sand">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </label>

        {mode === "password" && (
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand">Password</span>
            <input
              type="password"
              required
              minLength={action === "signup" ? 10 : undefined}
              autoComplete={action === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {action === "signup" && (
              <span className="mt-1.5 block text-xs text-dust">At least 10 characters.</span>
            )}
          </label>
        )}

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy
            ? "One moment…"
            : mode === "link"
              ? "Send my sign-in link"
              : action === "signin"
                ? "Sign in"
                : "Create my account"}
        </button>
      </form>

      {mode === "link" ? (
        <p className="text-sm leading-relaxed text-dust">
          New here? The same link creates your account. No password to remember.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => setAction(action === "signin" ? "signup" : "signin")}
            className="text-brass-bright underline-offset-4 hover:underline"
          >
            {action === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
          <Link href="/reset-password" className="text-dust hover:text-cream">
            Forgot password?
          </Link>
        </div>
      )}
    </div>
  );
}

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (/invalid login credentials/i.test(message)) return "That email and password don't match.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Check your inbox for the link.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/already registered/i.test(message)) return "There's already an account with that email. Try signing in.";
  if (/password/i.test(message)) return message;
  return "Something went wrong. Please try again.";
}
