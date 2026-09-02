"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AuditResponse } from "@/lib/types";
import { ReportCard } from "./ReportCard";
import { LeadCaptureForm } from "./LeadCaptureForm";

type Status = "idle" | "loading" | "error" | "done";

const LOADING_STEPS = [
  "Fetching your website...",
  "Analyzing your page...",
  "Scoring your online presence...",
];

export function AuditFlow() {
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName, websiteUrl, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setResult(data as AuditResponse);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setResult(null);
    setError(null);
  }

  if (status === "done" && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <ReportCard result={result} />
        <LeadCaptureForm
          defaultBusiness={result.businessName}
          city={result.city}
          auditedUrl={result.auditedUrl}
        />
        <div className="text-center">
          <button
            onClick={handleReset}
            className="text-sm font-medium text-ink-muted underline decoration-border underline-offset-4 hover:text-navy"
          >
            Run another audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-8"
      >
        <div className="grid gap-4">
          <div>
            <label htmlFor="businessName" className="mb-1 block text-xs font-medium text-ink-muted">
              Business name
            </label>
            <input
              id="businessName"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
              placeholder="Acme Plumbing Co."
            />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="mb-1 block text-xs font-medium text-ink-muted">
              Website URL
            </label>
            <input
              id="websiteUrl"
              required
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
              placeholder="acmeplumbing.com"
            />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-xs font-medium text-ink-muted">
              City
            </label>
            <input
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
              placeholder="Austin, TX"
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-critical">{error}</p> : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-6 w-full rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-navy-deep disabled:opacity-70"
        >
          {status === "loading" ? "Auditing your site..." : "Run My Free Audit"}
        </button>

        {status === "loading" ? (
          <ul className="mt-4 space-y-1 text-center text-xs text-ink-muted">
            {LOADING_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-center text-xs text-ink-muted">
            No signup required &middot; Results in about 20 seconds
          </p>
        )}
      </form>
    </div>
  );
}
