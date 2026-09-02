"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface LeadCaptureFormProps {
  defaultBusiness: string;
  city: string;
  auditedUrl: string;
}

type Status = "idle" | "submitting" | "success" | "error";

export function LeadCaptureForm({ defaultBusiness, city, auditedUrl }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState(defaultBusiness);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, business, city, auditedUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-center sm:px-8">
        <p className="text-lg font-semibold text-navy">You&apos;re all set.</p>
        <p className="mt-2 text-sm text-ink-muted">
          Thanks, {name.split(" ")[0] || "there"} - we&apos;ll reach out shortly to schedule your
          free 15-minute call.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold-soft bg-surface px-6 py-8 sm:px-8">
      <h3 className="text-lg font-semibold text-navy">
        Want us to fix the red items?
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Book a free 15-minute call and we&apos;ll walk through exactly what to fix first.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="lead-name" className="mb-1 block text-xs font-medium text-ink-muted">
            Name
          </label>
          <input
            id="lead-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Jane Smith"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="lead-email" className="mb-1 block text-xs font-medium text-ink-muted">
            Email
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="jane@business.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-business" className="mb-1 block text-xs font-medium text-ink-muted">
            Business
          </label>
          <input
            id="lead-business"
            required
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>

        {error ? <p className="sm:col-span-2 text-sm text-critical">{error}</p> : null}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-deep transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            {status === "submitting" ? "Sending..." : "Book My Free 15-Minute Call"}
          </button>
        </div>
      </form>
    </div>
  );
}
