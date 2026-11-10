"use client";

import Link from "next/link";
import { useDemo } from "@/lib/store";
import { countByStatus, todayViews } from "@/lib/doses";
import { Avatar, Card, PageHeader, cx } from "@/components/ui";

export default function ResidentsPage() {
  const { state, now, user } = useDemo();
  const views = todayViews(state, now);
  const list = state.residents
    .filter((r) => r.active || user?.role !== "caregiver")
    .sort((a, b) => Number(b.active) - Number(a.active) || a.room.localeCompare(b.room));
  return (
    <div>
      <PageHeader title="Residents" subtitle={`${state.residents.filter((r) => r.active).length} active residents · all names are fictional`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => {
          const c = countByStatus(views.filter((v) => v.residentId === r.id));
          const activeOrders = state.orders.filter((o) => o.residentId === r.id && o.status === "active").length;
          const mine = user?.role === "caregiver" && user.assignedResidentIds.includes(r.id);
          return (
            <Link key={r.id} href={`/residents/${r.id}`} className="block">
              <Card className={cx("h-full p-4 transition hover:border-brand-600 hover:shadow-md", !r.active && "opacity-60")}>
                <div className="flex items-center gap-3">
                  <Avatar name={`${r.firstName} ${r.lastName}`} id={r.id} size="md" />
                  <div className="min-w-0">
                    <div className="text-lg font-bold">
                      {r.firstName} {r.lastName}
                    </div>
                    <div className="text-slate-600">
                      Room {r.room} · {activeOrders} active orders {!r.active && "· Inactive"}
                    </div>
                  </div>
                  {mine && <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-sm font-semibold text-brand-800">Assigned</span>}
                </div>
                {r.allergies.length > 0 && <div className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-sm font-bold text-red-800">Allergies: {r.allergies.join(", ")}</div>}
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">{c.documented} documented</span>
                  {c.overdue > 0 && <span className="rounded-full bg-red-700 px-2 py-0.5 text-white">{c.overdue} overdue</span>}
                  {c.exception > 0 && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-slate-950">{c.exception} exception</span>}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-800">{c.pending} pending</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
