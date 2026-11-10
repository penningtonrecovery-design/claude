"use client";

import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { useDemo } from "@/lib/store";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { Avatar, Card } from "@/components/ui";
import { homeFor } from "@/components/AppShell";

const ROLE_BLURB: Record<Role, string> = {
  caregiver: "Med pass for assigned residents, document doses, view profiles.",
  supervisor: "Overdue & incomplete records, exception review, escalation, audit, reports, AI assistant.",
  admin: "Everything a supervisor sees, plus residents, staff accounts, mock schedules and onboarding.",
};

export default function LoginPage() {
  const { state, login } = useDemo();
  const router = useRouter();
  const roles: Role[] = ["caregiver", "supervisor", "admin"];
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 text-white">
          <ClipboardList className="h-8 w-8" aria-hidden />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">CareMAR</h1>
          <p className="text-slate-600">Electronic Medication Administration Record — demonstration prototype</p>
        </div>
      </div>

      <Card className="mb-6 border-2 border-amber-400 bg-amber-50 p-4">
        <p className="font-semibold text-slate-900">Simulated sign-in. No passwords, no real accounts.</p>
        <p className="text-slate-700">
          Pick a fictional staff member to see that role&apos;s view. You can switch users any time from the header. Real authentication is required before any
          production use (see README).
        </p>
      </Card>

      {roles.map((role) => {
        const people = state.staff.filter((s) => s.role === role && s.active);
        return (
          <section key={role} className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">{ROLE_LABEL[role]}</h2>
            <p className="mb-3 text-slate-600">{ROLE_BLURB[role]}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    login(s.id);
                    router.push(homeFor(s.role));
                  }}
                  className="flex min-h-20 items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-600 hover:shadow"
                >
                  <Avatar name={s.name} id={s.id} />
                  <span>
                    <span className="block text-lg font-bold text-slate-900">{s.name}</span>
                    <span className="block text-slate-600">{s.title}</span>
                    {s.role === "caregiver" && <span className="block text-sm text-slate-500">{s.assignedResidentIds.length} assigned residents</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
