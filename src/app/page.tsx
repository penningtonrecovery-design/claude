import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const QUALITIES = [
  {
    title: "He listens first",
    body: "No rush to fix you. He hears you out, reflects back what he heard, and asks one good question at a time.",
  },
  {
    title: "Honest, never harsh",
    body: "Warm and patient, but willing to gently call out an excuse when it's holding you back. Always on your side.",
  },
  {
    title: "Practical wisdom",
    body: "Small, hard-won lessons offered the way a grandfather would, plus one achievable next step when you want one.",
  },
];

const STEPS = [
  { n: "1", title: "Talk or type", body: "Speak with him out loud, or write if that feels easier. Pause or end any time." },
  { n: "2", title: "Make sense of it", body: "Explore what shaped you, at your own pace. You never have to share more than you want." },
  { n: "3", title: "Take one step", body: "Leave with something small and real to try. Come back and reflect on how it went." },
];

export default function Home() {
  return (
    <>
      <SiteHeader>
        <Link href="/login" className="text-sm text-sand hover:text-cream">
          Sign in
        </Link>
      </SiteHeader>

      <main className="flex-1">
        <section className="lamplight">
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
            <p className="mb-5 text-sm uppercase tracking-[0.2em] text-brass">For men, 18 and over</p>
            <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] text-cream sm:text-6xl">
              A steady voice in your corner.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sand">
              Fatherly Friend is a warm, wise AI companion for men who grew up without the
              guidance they needed, whether your father was absent, or there but out of reach.
              A private place to think out loud, understand yourself, and build the life you want.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/talk"
                className="rounded-full bg-brass px-7 py-3.5 text-center font-medium text-ink transition hover:bg-brass-bright"
              >
                Start a conversation
              </Link>
              <Link
                href="/privacy"
                className="rounded-full border border-line px-7 py-3.5 text-center text-cream transition hover:border-brass/60"
              >
                How your privacy works
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl text-cream">What he&apos;s like</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {QUALITIES.map((q) => (
              <div key={q.title} className="rounded-2xl border border-line bg-ink-2 p-6">
                <h3 className="font-serif text-xl text-brass-bright">{q.title}</h3>
                <p className="mt-3 leading-relaxed text-sand">{q.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-line/60 bg-ink-2/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-serif text-3xl text-cream">How it works</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brass/50 font-serif text-brass-bright">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-medium text-cream">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-sand">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl text-cream">Straight with you about what he is</h2>
            <p className="mt-4 leading-relaxed text-sand">
              Fatherly Friend is an AI. He won&apos;t pretend to be a real person, your father, or
              someone you&apos;ve lost. He isn&apos;t a therapist and doesn&apos;t diagnose anything.
              When something deserves a professional or a crisis line, he&apos;ll tell you so.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-3xl text-cream">Your story stays yours</h2>
            <p className="mt-4 leading-relaxed text-sand">
              Memory is off unless you turn it on, and you choose exactly what he remembers. Your
              text conversations aren&apos;t saved by the app. You can export or delete your data
              at any time.{" "}
              <Link href="/privacy" className="text-brass-bright underline underline-offset-4">
                Read the details
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
