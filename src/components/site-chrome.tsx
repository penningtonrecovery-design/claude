import Link from "next/link";
import type { ReactNode } from "react";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Fatherly Friend home">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-full border border-brass/50 bg-ink-3 font-serif text-lg text-brass-bright transition group-hover:border-brass"
      >
        F
      </span>
      <span className={`${compact ? "hidden sm:inline" : ""} whitespace-nowrap font-serif text-lg tracking-tight text-cream sm:text-xl`}>Fatherly Friend</span>
    </Link>
  );
}

export function HelpNowLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/help"
      className={`whitespace-nowrap rounded-full border border-ember/60 px-3 py-1.5 text-sm text-alert transition hover:bg-alert-bg ${className}`}
    >
      <span className="sm:hidden">Get help</span>
      <span className="hidden sm:inline">Need help now?</span>
    </Link>
  );
}

export function SiteHeader({ children, compactBrand = false }: { children?: ReactNode; compactBrand?: boolean }) {
  return (
    <header className="border-b border-line/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Wordmark compact={compactBrand} />
        <nav className="flex items-center gap-3 whitespace-nowrap sm:gap-4">
          {children}
          <HelpNowLink />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-dust sm:px-6 md:flex-row md:items-start md:justify-between">
        <p className="max-w-xl leading-relaxed">
          Fatherly Friend is an AI companion, not a therapist or a crisis service, and it
          doesn&apos;t replace professional care. If you&apos;re thinking about suicide or are in
          danger, call or text <a href="tel:988" className="text-alert underline">988</a> or
          call <a href="tel:911" className="text-alert underline">911</a>.
        </p>
        <nav className="flex gap-5">
          <Link href="/privacy" className="hover:text-cream">Privacy</Link>
          <Link href="/help" className="hover:text-cream">Crisis resources</Link>
        </nav>
      </div>
    </footer>
  );
}
