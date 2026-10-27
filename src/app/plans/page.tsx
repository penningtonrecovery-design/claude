import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { CrisisResources } from "@/components/crisis-resources";
import { ReflectionBanner } from "@/components/reflection-banner";
import { isTopic, LIBRARY, MAX_PLAN_STEPS } from "@/lib/growth/library";
import { getCurrentUser } from "@/lib/supabase/server";
import { PlanCard, type PlanView } from "./plan-card";

export const metadata: Metadata = { title: "Plans · Fatherly Friend" };

export default function PlansPage(props: PageProps<"/plans">) {
  return (
    <>
      <AppHeader current="plans" />
      <main className="flex-1 px-4 sm:px-6">
        <Suspense fallback={null}>
          <ReflectionBanner />
        </Suspense>
        <Suspense fallback={<PageLoading label="Loading your plans…" />}>
          <PlansContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function PlansContent({ searchParams }: { searchParams: PageProps<"/plans">["searchParams"] }) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/plans");
  const { support } = await searchParams;

  const { data: rows } = await supabase
    .from("growth_plans")
    .select("id, topic, focus, status, created_at, plan_steps (id, content, done_at, note, source, position)")
    .order("created_at", { ascending: false });

  const plans: PlanView[] = (rows ?? []).map((p) => ({
    id: p.id,
    label: isTopic(p.topic) ? LIBRARY[p.topic].label : p.topic,
    focus: p.focus,
    status: p.status,
    createdAt: p.created_at,
    steps: [...(p.plan_steps ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: s.id, content: s.content, doneAt: s.done_at, note: s.note, source: s.source })),
  }));

  const active = plans.filter((p) => p.status === "active");
  const past = plans.filter((p) => p.status !== "active");

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-cream">Your plans</h1>
          <p className="mt-2 max-w-xl leading-relaxed text-sand">
            Small steps, at your pace. Change them, skip them, or set a plan aside whenever you need to.
          </p>
        </div>
        <Link href="/plans/new" className="rounded-full bg-brass px-6 py-3 font-medium text-ink transition hover:bg-brass-bright">
          Start a plan
        </Link>
      </div>

      {support === "1" && (
        <section aria-label="Support resources" className="rounded-2xl border border-ember/50 bg-ink-2 p-5">
          <h2 className="font-serif text-xl text-cream">Before anything else, are you safe right now?</h2>
          <p className="mb-4 mt-2 text-sm leading-relaxed text-sand">
            Something you wrote sounded heavy. A real person can help, any hour, for free.
          </p>
          <CrisisResources compact />
        </section>
      )}

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="font-serif text-2xl text-cream">No plan yet, and that&apos;s fine.</p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-sand">
            When you&apos;re ready, pick one thing you&apos;d like to grow in. We&apos;ll keep it small.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.map((plan) => (
            <PlanCard key={plan.id} plan={plan} maxSteps={MAX_PLAN_STEPS} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sand hover:text-cream">
            Completed and set-aside plans ({past.length})
          </summary>
          <div className="mt-4 space-y-5">
            {past.map((plan) => (
              <PlanCard key={plan.id} plan={plan} maxSteps={MAX_PLAN_STEPS} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
