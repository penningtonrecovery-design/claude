import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { CrisisResources } from "@/components/crisis-resources";
import { getAiConfig, getVoiceConfig } from "@/lib/config";
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
    .select("display_name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) return <Onboarding />;

  return (
    <Conversation
      displayName={profile.display_name}
      voiceConfigured={getVoiceConfig() !== null}
      aiConfigured={getAiConfig() !== null}
      resources={<CrisisResources compact />}
    />
  );
}
