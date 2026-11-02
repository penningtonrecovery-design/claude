"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell, inputClass, Notice, NotConfigured, primaryButtonClass } from "@/components/auth-shell";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(
        /session|auth/i.test(error.message)
          ? "This reset link has expired. Please request a new one."
          : error.message,
      );
      return;
    }
    router.replace("/talk");
    router.refresh();
  }

  return (
    <AuthShell title="Choose a new password">
      {!supabaseConfigured ? (
        <NotConfigured />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand">New password</span>
            <input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <span className="mt-1.5 block text-xs text-dust">At least 10 characters.</span>
          </label>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? "Saving…" : "Save password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
