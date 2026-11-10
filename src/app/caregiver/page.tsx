"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useDemo } from "@/lib/store";
import { buildDoseViews, countByStatus } from "@/lib/doses";
import { addDays, dateKey, fmtDate, fmtHHMM, relative } from "@/lib/time";
import { OUTCOME_LABEL, type DoseView } from "@/lib/types";
import { Avatar, Card, Empty, PageHeader, Stat, StatusBadge, cx } from "@/components/ui";
import { DoseDialog } from "@/components/DoseDialog";

type Filter = "all" | "due" | "overdue" | "exception" | "documented";

export default function CaregiverDashboard() {
  const { state, now, user } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");
  const [day, setDay] = useState<"today" | "yesterday">("today");
  const [open, setOpen] = useState<string | null>(null);
  const [residentFilter, setResidentFilter] = useState<string>("all");

  const today = dateKey(now);
  const date = day === "today" ? today : addDays(today, -1);
  const mine = user?.role === "caregiver";

  const views = useMemo(() => {
    const all = buildDoseViews(state, date, date, now);
    return mine ? all.filter((v) => user!.assignedResidentIds.includes(v.residentId)) : all;
  }, [state, date, now, mine, user]);

  const counts = countByStatus(views);
  const filtered = views.filter((v) => {
    if (residentFilter !== "all" && v.residentId !== residentFilter) return false;
    if (filter === "due") return v.status === "pending" && v.dueNow;
    if (filter === "all") return true;
    return v.status === filter;
  });

  const slots = new Map<string, DoseView[]>();
  for (const v of filtered) slots.set(v.time, [...(slots.get(v.time) ?? []), v]);
  const residentsInView = [...new Map(views.map((v) => [v.residentId, v.resident])).values()].sort((a, b) => a.room.localeCompare(b.room));

  const chips: { id: Filter; label: string; n: number }[] = [
    { id: "all", label: "All", n: counts.total },
    { id: "due", label: "Due now", n: counts.dueNow },
    { id: "overdue", label: "Overdue", n: counts.overdue },
    { id: "exception", label: "Exceptions", n: counts.exception },
    { id: "documented", label: "Documented", n: counts.documented },
  ];

  return (
    <div>
      <PageHeader
        title={mine ? `Good ${new Date(now).getHours() < 12 ? "morning" : new Date(now).getHours() < 17 ? "afternoon" : "evening"}, ${user!.name.split(" ")[0]}` : "Med pass — all residents"}
        subtitle={`${fmtDate(date)} · ${mine ? `${user!.assignedResidentIds.length} assigned residents` : `${residentsInView.length} residents`} · Tap a medication to review and document it.`}
        actions={
          <div className="flex rounded-xl border-2 border-slate-300 bg-white p-1">
            {(["yesterday", "today"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                aria-pressed={day === d}
                className={cx("min-h-10 rounded-lg px-4 font-semibold capitalize", day === d ? "bg-brand-700 text-white" : "text-slate-700")}
              >
                {d}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Due now" value={counts.dueNow} tone="blue" />
        <Stat label="Overdue" value={counts.overdue} tone="red" />
        <Stat label="Exceptions" value={counts.exception} tone="amber" />
        <Stat label="Documented" value={`${counts.documented}/${counts.total}`} tone="green" />
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
            className={cx(
              "min-h-11 rounded-full border-2 px-4 font-semibold",
              filter === c.id ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500",
            )}
          >
            {c.label} <span className="ml-1 opacity-80">{c.n}</span>
          </button>
        ))}
        <label htmlFor="resfilter" className="sr-only">
          Filter by resident
        </label>
        <select id="resfilter" value={residentFilter} onChange={(e) => setResidentFilter(e.target.value)} className="min-h-11 rounded-full border-2 border-slate-300 bg-white px-4 font-semibold">
          <option value="all">All residents</option>
          {residentsInView.map((r) => (
            <option key={r.id} value={r.id}>
              Room {r.room} — {r.firstName} {r.lastName}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty>No medications match this filter.</Empty>
      ) : (
        <div className="space-y-5">
          {[...slots.entries()].map(([time, list]) => {
            const c = countByStatus(list);
            return (
              <section key={time} aria-labelledby={`slot-${time}`}>
                <div className="mb-2 flex flex-wrap items-baseline gap-3">
                  <h2 id={`slot-${time}`} className="text-xl font-bold text-slate-900">
                    {fmtHHMM(time)}
                  </h2>
                  <span className="text-slate-600">
                    {day === "today" && relative(list[0].scheduledAt, now)} · {c.documented + c.exception}/{c.total} documented
                    {c.overdue > 0 && <b className="text-red-700"> · {c.overdue} overdue</b>}
                  </span>
                </div>
                <Card className="divide-y divide-slate-200 overflow-hidden">
                  {list.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setOpen(v.id)}
                      className={cx(
                        "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50",
                        v.status === "overdue" && "border-l-8 border-red-700 bg-red-50/60",
                        v.status === "pending" && v.dueNow && "border-l-8 border-blue-700",
                        v.status === "exception" && "border-l-8 border-amber-500",
                      )}
                    >
                      <Avatar name={`${v.resident.firstName} ${v.resident.lastName}`} id={v.resident.id} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold leading-snug">
                          {v.order.name} <span className="font-semibold text-slate-600">{v.order.strength}</span>
                        </div>
                        <div className="text-slate-700">
                          {v.resident.firstName} {v.resident.lastName} · Rm {v.resident.room} · {v.order.dose}, {v.order.route}
                        </div>
                        {v.record && v.record.outcome !== "administered" && (
                          <div className="text-sm font-semibold text-amber-800">
                            {OUTCOME_LABEL[v.record.outcome]}: {v.record.reason}
                          </div>
                        )}
                        {v.resident.allergies.length > 0 && <div className="text-sm font-semibold text-red-700">Allergy: {v.resident.allergies.join(", ")}</div>}
                      </div>
                      <StatusBadge status={v.status} dueNow={v.dueNow} />
                      <ChevronRight className="hidden h-6 w-6 text-slate-400 sm:block" aria-hidden />
                    </button>
                  ))}
                </Card>
              </section>
            );
          })}
        </div>
      )}
      <DoseDialog doseId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
