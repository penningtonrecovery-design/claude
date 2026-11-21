import type { Metadata } from "next";
import Link from "next/link";
import { CrisisResources } from "@/components/crisis-resources";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Help right now · Fatherly Friend" };

export default function HelpPage() {
  return (
    <>
      <SiteHeader>
        <Link href="/talk" className="text-sm text-sand hover:text-cream">
          Back to conversation
        </Link>
      </SiteHeader>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-serif text-4xl text-cream">You don&apos;t have to carry this alone.</h1>
        <p className="mt-4 text-lg leading-relaxed text-sand">
          If you&apos;re thinking about ending your life, hurting yourself or someone else, or
          you&apos;re not safe where you are, please reach out to a real person now. These
          services are free and available any time.
        </p>
        <div className="mt-8">
          <CrisisResources />
        </div>
        <p className="mt-8 text-sm leading-relaxed text-dust">
          These resources are for the United States. If you&apos;re somewhere else, call your
          local emergency number. Fatherly Friend is an AI companion and can&apos;t contact anyone
          on your behalf.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
