"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell, inputClass, Notice, NotConfigured, primaryButtonClass } from "@/components/auth-shell";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setBusy(false);
    if (error) setError("We couldn't send that email. Please wait a minute and try again.");
    else setDone(true);
  }

  return (
    <AuthShell title="Reset your password" intro="We'll email you a link to choose a new one.">
      {!supabaseConfigured ? (
        <NotConfigured />
      ) : done ? (
        <Notice tone="info">
          If there&apos;s an account for {email}, a reset link is on its way.
        </Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-dust hover:text-cream">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
