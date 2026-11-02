import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { CrisisResources } from "@/components/crisis-resources";
import { getAiConfig } from "@/lib/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { PlanBuilder } from "./plan-builder";

export const metadata: Metadata = { title: "New plan · Fatherly Friend" };

export default function NewPlanPage() {
  return (
    <>
      <AppHeader current="plans" />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<PageLoading label="One moment…" />}>
            <NewPlanContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function NewPlanContent() {
  const { user } = await getCurrentUser();
  if (!user) redirect("/login?next=/plans/new");
  return <PlanBuilder aiConfigured={getAiConfig() !== null} resources={<CrisisResources compact />} />;
}
