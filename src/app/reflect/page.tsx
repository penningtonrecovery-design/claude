import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader, PageLoading } from "@/components/app-header";
import { REFLECTION_AREAS, REFLECTION_INTERVAL_DAYS } from "@/lib/growth/reflection";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteReflection } from "./actions";
import { ReflectionForm } from "./reflection-form";

export const metadata: Metadata = { title: "Reflect · Fatherly Friend" };

export default function ReflectPage(props: PageProps<"/reflect">) {
  return (
    <>
      <AppHeader current="reflect" />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<PageLoading label="Loading…" />}>
            <ReflectContent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

type ReflectionRow = {
  id: string;
  created_at: string;
  proud_of: string | null;
} & Record<string, number | string | null>;

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

async function ReflectContent({ searchParams }: { searchParams: PageProps<"/reflect">["searchParams"] }) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/reflect");
  const { saved } = await searchParams;

  const { data } = await supabase
    .from("reflections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);
  const history = (data ?? []) as ReflectionRow[];
  // Oldest on the left so the trend reads left to right.
  const columns = [...history].reverse();
  const nextOffer = history[0]
    ? new Date(new Date(history[0].created_at).getTime() + REFLECTION_INTERVAL_DAYS * 86_400_000)
    : null;
  const recent = nextOffer !== null && nextOffer > new Date();

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-brass">Monthly reflection</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Take a look back.</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-sand">
          Rate each area from 1 to 5, as it feels to you right now. Skip anything you like. This is
          your own sense of things, not a test or a clinical measure, and it isn&apos;t shared with
          the AI.
        </p>
      </header>

      {saved === "1" && (
        <p role="status" className="rounded-xl border border-moss/40 bg-moss/10 px-4 py-3 text-cream">
          Saved. Taking stock like this is its own kind of progress.
        </p>
      )}

      {columns.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-cream">How it&apos;s looked</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-ink-2 text-dust">
                <tr>
                  <th scope="col" className="px-4 py-3 font-normal">Area</th>
                  {columns.map((r) => (
                    <th key={r.id} scope="col" className="px-3 py-3 text-center font-normal">
                      {dateFormat.format(new Date(r.created_at))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {REFLECTION_AREAS.map((area) => (
                  <tr key={area.key}>
                    <th scope="row" className="px-4 py-3 font-normal text-sand">{area.label}</th>
                    {columns.map((r) => {
                      const value = r[area.key] as number | null;
                      return (
                        <td key={r.id} className="px-3 py-3 text-center">
                          {value ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-block h-2 rounded-full bg-brass/80" style={{ width: `${value * 12}px` }} aria-hidden />
                              <span className="text-cream">{value}</span>
                            </span>
                          ) : (
                            <span className="text-dust">–</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-sand hover:text-cream">Your notes</summary>
            <ul className="mt-3 space-y-4">
              {history.map((r) => (
                <li key={r.id} className="rounded-xl border border-line bg-ink-2 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-brass">{dateFormat.format(new Date(r.created_at))}</span>
                    <form action={deleteReflection}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-sm text-dust hover:text-alert">Delete</button>
                    </form>
                  </div>
                  {r.proud_of && <p className="mt-2 text-cream">Proud of: {r.proud_of}</p>}
                  {REFLECTION_AREAS.map((a) =>
                    r[`${a.key}_note`] ? (
                      <p key={a.key} className="mt-1 text-sm text-sand">
                        <span className="text-dust">{a.label}:</span> {r[`${a.key}_note`]}
                      </p>
                    ) : null,
                  )}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {recent && nextOffer ? (
        <section className="rounded-2xl border border-line bg-ink-2 p-5">
          <p className="leading-relaxed text-sand">
            You reflected recently. The next one will be offered around{" "}
            <span className="text-cream">{dateFormat.format(nextOffer)}</span>.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-brass-bright">Reflect again anyway</summary>
            <div className="mt-5">
              <ReflectionForm />
            </div>
          </details>
        </section>
      ) : (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-cream">{columns.length > 0 ? "This month" : "Your first reflection"}</h2>
          <ReflectionForm />
        </section>
      )}
    </div>
  );
}
