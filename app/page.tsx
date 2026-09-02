import { AuditFlow } from "@/components/AuditFlow";

const CHECKS = [
  "Clear value proposition above the fold",
  "Mobile-friendly setup",
  "Page load speed",
  "Click-to-call on mobile",
  "Google reviews & social proof",
  "One clear primary call-to-action",
  "Contact info findable in under 5 seconds",
];

export default function Home() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold tracking-wide text-navy">P&amp;G AI CONSULTING</p>
          </div>
          <a
            href="#audit"
            className="hidden rounded-lg border border-navy px-4 py-2 text-xs font-semibold text-navy transition hover:bg-navy hover:text-white sm:block"
          >
            Run a Free Audit
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-gold-soft/60 to-background px-6 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Free Instant Audit
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-navy sm:text-4xl">
              Is your website costing you customers?
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              Enter your business info below and get an instant, AI-powered scorecard of your
              website and online presence - free, no signup required.
            </p>

            <ul className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-x-6 gap-y-1.5 text-left text-sm text-ink-muted sm:grid-cols-2">
              {CHECKS.map((check) => (
                <li key={check} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="audit" className="px-6 py-12 sm:py-16">
          <AuditFlow />
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-8 text-sm text-ink-muted">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center">
          <p className="font-semibold text-navy">P&amp;G AI Consulting</p>
          <p>[phone] &middot; [business email] &middot; [city, state]</p>
          <p className="text-xs">&copy; {new Date().getFullYear()} P&amp;G AI Consulting. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
