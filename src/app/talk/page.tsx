import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { CrisisResources } from "@/components/crisis-resources";
import { ReflectionBanner } from "@/components/reflection-banner";
import { isCheckinDue, isCheckinFrequency, pickCheckin, type CheckinNote } from "@/lib/checkins";
import { getAiConfig, getVoiceConfig } from "@/lib/config";
import { isReflectionDue } from "@/lib/growth/reflection";
import { getCurrentUser } from "@/lib/supabase/server";
import { Conversation } from "./conversation";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Conversation · Fatherly Friend" };

export default function TalkPage() {
  return (
    <>
      <AppHeader current="talk" />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<PageLoading label="Pulling up a chair…" />}>
          <TalkContent />
        </Suspense>
      </main>
    </>
  );
}

async function TalkContent() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/talk");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, onboarding_completed_at, memory_enabled, reflection_prompts_enabled, reflection_snoozed_until, checkin_frequency, checkin_enabled_at, last_checkin_at, last_checkin_key",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) return <Onboarding />;

  const checkin = await chooseCheckin(supabase, profile);

  return (
    <>
      <div className="px-4 sm:px-6">
        <Suspense fallback={null}>
          <ReflectionBanner />
        </Suspense>
      </div>
      <Conversation
        displayName={profile.display_name}
        voiceConfigured={getVoiceConfig() !== null}
        aiConfigured={getAiConfig() !== null}
        resources={<CrisisResources compact />}
        checkin={checkin}
      />
    </>
  );
}

type Supabase = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>["supabase"]>;

// One gentle prompt at a time: a due reflection takes precedence over a check-in.
async function chooseCheckin(
  supabase: Supabase,
  profile: Record<string, string | boolean | null>,
): Promise<CheckinNote | null> {
  const frequency = isCheckinFrequency(profile.checkin_frequency) ? profile.checkin_frequency : "off";
  const now = new Date();
  const due = isCheckinDue({
    now,
    frequency,
    enabledAt: profile.checkin_enabled_at as string | null,
    lastCheckinAt: profile.last_checkin_at as string | null,
  });
  if (!due) return null;

  const { data: last } = await supabase
    .from("reflections")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const reflectionDue = isReflectionDue({
    now,
    promptsEnabled: profile.reflection_prompts_enabled !== false,
    snoozedUntil: profile.reflection_snoozed_until as string | null,
    onboardedAt: profile.onboarding_completed_at as string | null,
    lastReflectionAt: last?.created_at ?? null,
  });
  if (reflectionDue) return null;

  // His own plan steps are only used with memory consent.
  let openSteps: string[] = [];
  if (profile.memory_enabled) {
    const { data: steps } = await supabase
      .from("plan_steps")
      .select("content, growth_plans!inner(status)")
      .is("done_at", null)
      .eq("growth_plans.status", "active")
      .limit(10);
    openSteps = (steps ?? []).map((s) => s.content as string);
  }

  return pickCheckin({ now, lastKey: profile.last_checkin_key as string | null, openSteps });
}
