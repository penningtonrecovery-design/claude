"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useDemo } from "@/lib/store";
import type { AuditAction } from "@/lib/types";
import { Card, PageHeader, cx } from "@/components/ui";
import { RequireRole } from "@/components/AppShell";

const STEPS: { title: string; body: string; href: string; cta: string; done: AuditAction[] }[] = [
  { title: "Name your facility", body: "Set the (fictional) facility name and the documentation window used to flag overdue doses.", href: "/admin", cta: "Admin → Facility & demo", done: ["settings.updated"] },
  { title: "Add a staff account", body: "Create a simulated caregiver and assign residents. Roles decide what each person can see and do.", href: "/admin", cta: "Admin → Staff & roles", done: ["staff.created", "staff.updated"] },
  { title: "Add a resident", body: "Enter a fictional resident with room number and allergies.", href: "/admin", cta: "Admin → Residents", done: ["resident.created"] },
  { title: "Configure a mock medication schedule", body: "Add a fictional order with scheduled times. It appears on the med pass immediately.", href: "/admin", cta: "Admin → Medication schedules", done: ["order.created", "order.schedule_changed"] },
  { title: "Run a med pass", body: "Switch to a caregiver (header menu), open a due medication, choose an outcome, and confirm.", href: "/caregiver", cta: "Open med pass", done: ["dose.documented"] },
  { title: "Review exceptions as a supervisor", body: "Acknowledge or escalate a refused dose, or send a documentation reminder.", href: "/supervisor", cta: "Supervisor dashboard", done: ["review.acknowledged", "review.escalated", "reminder.sent"] },
  { title: "Print a report or export the audit log", body: "Generate an inspection-style report or export the mock audit log.", href: "/reports", cta: "Open reports", done: ["report.generated", "audit.exported"] },
];

export default function OnboardingPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Onboarding />
    </RequireRole>
  );
}

function Onboarding() {
  const { state } = useDemo();
  const since = state.audit.filter((e) => e.at >= state.seededAt);
  const isDone = (actions: AuditAction[]) => since.some((e) => actions.includes(e.action));
  const completed = STEPS.filter((s) => isDone(s.done)).length;
  return (
    <div>
      <PageHeader title="Onboarding walkthrough" subtitle={`${completed} of ${STEPS.length} steps complete · progress is detected automatically from the audit trail`} />
      <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={STEPS.length}>
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${(completed / STEPS.length) * 100}%` }} />
      </div>
      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const done = isDone(s.done);
          return (
            <li key={s.title}>
              <Card className={cx("flex items-start gap-4 p-4", done && "border-emerald-300 bg-emerald-50")}>
                {done ? <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-emerald-700" aria-label="Done" /> : <Circle className="mt-1 h-7 w-7 shrink-0 text-slate-400" aria-label="Not done" />}
                <div className="flex-1">
                  <h2 className="text-lg font-bold">
                    {i + 1}. {s.title}
                  </h2>
                  <p className="text-slate-700">{s.body}</p>
                </div>
                <Link href={s.href} className="shrink-0 self-center rounded-xl border-2 border-slate-300 bg-white px-3 py-2 font-semibold hover:border-brand-600">
                  {s.cta}
                </Link>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
