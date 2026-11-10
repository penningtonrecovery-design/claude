"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useDemo } from "@/lib/store";
import { buildDoseViews } from "@/lib/doses";
import { addDays, dateKey, fmtDate, fmtDateTime, fmtHHMM, fmtTime } from "@/lib/time";
import { OUTCOME_LABEL } from "@/lib/types";
import { Avatar, Card, Empty, StatusBadge, cx } from "@/components/ui";
import { DoseDialog } from "@/components/DoseDialog";

export default function ResidentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, now } = useDemo();
  const [open, setOpen] = useState<string | null>(null);
  const r = state.residents.find((x) => x.id === id);
  if (!r) return <Empty>Resident not found.</Empty>;

  const today = dateKey(now);
  const orders = state.orders.filter((o) => o.residentId === r.id);
  const active = orders.filter((o) => o.status === "active");
  const discontinued = orders.filter((o) => o.status === "discontinued");
  const todays = buildDoseViews(state, today, today, now).filter((v) => v.residentId === r.id);
  const history = buildDoseViews(state, addDays(today, -6), addDays(today, -1), now)
    .filter((v) => v.residentId === r.id)
    .reverse();
  const staffName = (sid: string) => state.staff.find((s) => s.id === sid)?.name ?? sid;
  const age = new Date(now).getFullYear() - r.birthYear;

  return (
    <div>
      <Link href="/residents" className="no-print mb-3 inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All residents
      </Link>
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={`${r.firstName} ${r.lastName}`} id={r.id} size="lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {r.firstName} {r.lastName} {r.preferredName && <span className="text-xl font-normal text-slate-600">“{r.preferredName}”</span>}
            </h1>
            <p className="text-lg text-slate-700">
              Room {r.room} · Age {age} (born {r.birthYear}) · Physician: {r.physician} (fictional)
            </p>
            {!r.active && <p className="font-bold text-amber-700">Inactive resident — history retained</p>}
          </div>
          <div className={cx("rounded-xl border-2 px-4 py-2 font-bold", r.allergies.length ? "border-red-600 bg-red-50 text-red-800" : "border-slate-300 text-slate-700")}>
            {r.allergies.length ? `Allergies: ${r.allergies.join(", ")}` : "No known allergies (fictional)"}
          </div>
        </div>
        {r.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-slate-700">Care note: {r.notes}</p>}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xl font-bold">Today — {fmtDate(today)}</h2>
          <Card className="divide-y divide-slate-200">
            {todays.length === 0 && <div className="p-4 text-slate-600">No scheduled medications today.</div>}
            {todays.map((v) => (
              <button key={v.id} onClick={() => setOpen(v.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <span className="w-20 shrink-0 font-bold">{fmtHHMM(v.time)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {v.order.name} {v.order.strength}
                  </span>
                  <span className="text-sm text-slate-600">
                    {v.record ? `${OUTCOME_LABEL[v.record.outcome]} by ${staffName(v.record.staffId)} at ${fmtTime(v.record.recordedAt)}` : `${v.order.dose}, ${v.order.route}`}
                  </span>
                </span>
                <StatusBadge status={v.status} dueNow={v.dueNow} />
              </button>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">Active medication orders ({active.length})</h2>
          <div className="space-y-2">
            {active.map((o) => (
              <Card key={o.id} className="border-l-8 border-l-emerald-600 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-lg font-bold">
                    {o.name} {o.strength}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 text-sm font-bold text-emerald-900">ACTIVE</span>
                </div>
                <div className="text-slate-700">
                  {o.dose} · {o.route} · {o.times.map(fmtHHMM).join(", ")}
                </div>
                <div className="text-sm text-slate-600">
                  {o.indication && `For: ${o.indication} · `}
                  {o.instructions}
                </div>
              </Card>
            ))}
          </div>
          {discontinued.length > 0 && (
            <>
              <h2 className="mb-2 mt-5 text-xl font-bold text-slate-600">Discontinued orders ({discontinued.length})</h2>
              <div className="space-y-2">
                {discontinued.map((o) => (
                  <Card key={o.id} className="border-dashed bg-slate-50 p-3 text-slate-500">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-lg font-bold line-through">
                        {o.name} {o.strength}
                      </span>
                      <span className="rounded-full bg-slate-300 px-2 text-sm font-bold text-slate-800">DISCONTINUED</span>
                    </div>
                    <div>
                      Was: {o.dose} · {o.times.map(fmtHHMM).join(", ")}
                    </div>
                    <div className="text-sm">
                      Stopped {o.discontinuedAt ? fmtDateTime(o.discontinuedAt) : ""} — {o.discontinuedReason}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-xl font-bold">Documentation history (previous 6 days)</h2>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">Scheduled</th>
                <th className="px-3 py-2">Medication</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Recorded by</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((v) => (
                <tr key={v.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(v.id)}>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(v.scheduledAt)}</td>
                  <td className="px-3 py-2">
                    {v.order.name} {v.order.strength}
                    {v.order.status === "discontinued" && <span className="ml-1 text-xs font-bold text-slate-500">(DC)</span>}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-3 py-2">{v.record ? `${staffName(v.record.staffId)}, ${fmtTime(v.record.recordedAt)}` : "—"}</td>
                  <td className="px-3 py-2 text-sm">
                    {v.record?.reason}
                    {v.history.length > 1 && <span className="ml-1 rounded bg-blue-100 px-1 font-semibold text-blue-900">corrected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <DoseDialog doseId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
