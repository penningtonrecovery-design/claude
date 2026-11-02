import Link from "next/link";
import { snoozeReflection } from "@/app/reflect/actions";
import { isReflectionDue } from "@/lib/growth/reflection";
import { getCurrentUser } from "@/lib/supabase/server";

// A gentle, dismissible offer to reflect. Shown only when one is due.
export async function ReflectionBanner() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) return null;

  const [{ data: profile }, { data: last }] = await Promise.all([
    supabase
      .from("profiles")
      .select("reflection_prompts_enabled, reflection_snoozed_until, onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("reflections").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!profile) return null;

  const due = isReflectionDue({
    now: new Date(),
    promptsEnabled: profile.reflection_prompts_enabled,
    snoozedUntil: profile.reflection_snoozed_until,
    onboardedAt: profile.onboarding_completed_at,
    lastReflectionAt: last?.created_at ?? null,
  });
  if (!due) return null;

  return (
    <aside className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-brass/40 bg-ink-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="leading-relaxed text-sand">
        <span className="font-serif text-lg text-cream">It&apos;s been about a month.</span>{" "}
        Want to take two minutes to look back?
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <Link href="/reflect" className="rounded-full bg-brass px-5 py-2 text-sm font-medium text-ink transition hover:bg-brass-bright">
          Reflect
        </Link>
        <form action={snoozeReflection}>
          <button type="submit" className="text-sm text-dust hover:text-cream">Not now</button>
        </form>
      </div>
    </aside>
  );
}
