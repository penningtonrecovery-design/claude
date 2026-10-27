import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteAllMemories, deleteMemory, setMemoryEnabled } from "./actions";
import { AddMemoryForm, DeleteAccountForm, DisplayNameForm } from "./forms";

export const metadata: Metadata = { title: "Settings · Fatherly Friend" };

export default function SettingsPage() {
  return (
    <>
      <AppHeader current="settings" />
      <main className="flex-1">
        <Suspense fallback={<PageLoading label="Loading your settings…" />}>
          <SettingsContent />
        </Suspense>
      </main>
    </>
  );
}

function Card({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-ink-2 p-6">
      <h2 className="font-serif text-2xl text-cream">{title}</h2>
      {intro && <p className="mt-2 leading-relaxed text-sand">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  goal: "Goal",
  experience: "Experience",
  preference: "Preference",
  challenge: "Challenge",
  achievement: "Achievement",
  other: "Other",
};

async function SettingsContent() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/settings");

  const [{ data: profile }, { data: memories }] = await Promise.all([
    supabase.from("profiles").select("display_name, memory_enabled").eq("id", user.id).maybeSingle(),
    supabase.from("memories").select("id, category, content, created_at").order("created_at", { ascending: false }),
  ]);
  const memoryOn = Boolean(profile?.memory_enabled);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl text-cream">Settings</h1>
      <p className="text-sand">Signed in as {user.email}</p>

      <Card title="What he calls you" intro="Optional. Change or remove it any time.">
        <DisplayNameForm current={profile?.display_name ?? null} />
      </Card>

      <Card
        title="Memory"
        intro={
          memoryOn
            ? "On. He keeps the notes below in mind during conversations. Only notes you write here are stored."
            : "Off. Nothing carries over between conversations. Turn it on to save notes he'll keep in mind."
        }
      >
        <form action={setMemoryEnabled}>
          <input type="hidden" name="enabled" value={memoryOn ? "false" : "true"} />
          <button type="submit" className="rounded-full border border-line px-5 py-2.5 text-sm text-cream transition hover:border-brass/60">
            {memoryOn ? "Turn memory off" : "Turn memory on"}
          </button>
        </form>

        {memoryOn && (
          <div className="mt-6">
            <AddMemoryForm />
          </div>
        )}

        {memories && memories.length > 0 && (
          <div className="mt-6">
            {!memoryOn && (
              <p className="mb-3 text-sm text-dust">
                These saved notes aren&apos;t being used while memory is off. Delete them if you
                don&apos;t want them kept.
              </p>
            )}
            <ul className="divide-y divide-line rounded-xl border border-line">
              {memories.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-brass">{CATEGORY_LABEL[m.category] ?? m.category}</span>
                    <p className="mt-1 leading-relaxed text-cream">{m.content}</p>
                  </div>
                  <form action={deleteMemory}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="text-sm text-dust hover:text-alert" aria-label={`Delete note: ${m.content}`}>
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={deleteAllMemories} className="mt-3">
              <button type="submit" className="text-sm text-dust hover:text-alert">Delete all notes</button>
            </form>
          </div>
        )}
      </Card>

      <Card title="Your data" intro="Download everything Fatherly Friend stores about you.">
        <a href="/api/account/export" className="inline-block rounded-full border border-line px-5 py-2.5 text-sm text-cream transition hover:border-brass/60">
          Download my data
        </a>
      </Card>

      <Card title="Sign out">
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-full border border-line px-5 py-2.5 text-sm text-cream transition hover:border-brass/60">
            Sign out
          </button>
        </form>
      </Card>

      <Card title="Delete account" intro="This can't be undone.">
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
