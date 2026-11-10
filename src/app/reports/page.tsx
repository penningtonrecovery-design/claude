"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { useDemo } from "@/lib/store";
import { completeness, completenessReport, dailySummary, exceptionsReport, type Tally } from "@/lib/reports";
import { logReportGenerated } from "@/lib/actions";
import { addDays, dateKey, fmtDate, fmtDateTime, fmtHHMM, fmtTime } from "@/lib/time";
import { OUTCOME_LABEL } from "@/lib/types";
import { Button, Card, PageHeader, StatusBadge, Tabs, inputCls } from "@/components/ui";
import { RequireRole } from "@/components/AppShell";

type Tab = "daily" | "exceptions" | "completeness";
const TITLES: Record<Tab, string> = {
  daily: "Daily Medication Administration Summary",
  exceptions: "Missed & Refused Medication Report",
  completeness: "Documentation Completeness Report",
};

export default function ReportsPage() {
  return (
    <RequireRole roles={["supervisor", "admin"]}>
      <Reports />
    </RequireRole>
  );
}

const pct = (t: Tally) => {
  const c = completeness(t);
  return c === null ? "—" : `${Math.round(c * 100)}%`;
};

function Reports() {
  const { state, now, user, run } = useDemo();
  const today = dateKey(now);
  const [tab, setTab] = useState<Tab>("daily");
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState(addDays(today, -3));
  const [to, setTo] = useState(today);
  const staffName = (id: string) => state.staff.find((s) => s.id === id)?.name ?? id;

  const print = () => {
    run((s, a, t) => logReportGenerated(s, a.id, TITLES[tab], t));
    setTimeout(() => window.print(), 50);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Inspection-style reports generated from fictional demo data."
        actions={
          <Button onClick={print}>
            <Printer className="h-5 w-5" aria-hidden /> Print / save as PDF
          </Button>
        }
      />
      <Tabs
        tabs={[
          { id: "daily", label: "Daily summary" },
          { id: "exceptions", label: "Missed & refused" },
          { id: "completeness", label: "Completeness" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        {tab === "daily" ? (
          <label className="font-semibold">
            Date
            <input type="date" className={inputCls} value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
        ) : (
          <>
            <label className="font-semibold">
              From
              <input type="date" className={inputCls} value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
            </label>
            <label className="font-semibold">
              To
              <input type="date" className={inputCls} value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} />
            </label>
          </>
        )}
      </div>

      <Card className="p-5 print:border-0 print:shadow-none">
        <div className="mb-4 border-b-2 border-slate-800 pb-3">
          <div className="mb-2 rounded bg-red-700 px-2 py-1 text-center text-sm font-extrabold text-white print:border print:border-black print:bg-white print:text-black">
            DEMO ONLY — FICTIONAL DATA — NOT AN OFFICIAL MEDICATION RECORD — NOT FOR CLINICAL OR REGULATORY USE
          </div>
          <h2 className="text-2xl font-bold">{TITLES[tab]}</h2>
          <p className="text-slate-700">
            {state.settings.facilityName} · {tab === "daily" ? fmtDate(date) : `${fmtDate(from)} – ${fmtDate(to)}`} · Generated {fmtDateTime(now)} by {user?.name}
          </p>
        </div>
        {tab === "daily" && <Daily date={date} staffName={staffName} />}
        {tab === "exceptions" && <Exceptions from={from} to={to} staffName={staffName} />}
        {tab === "completeness" && <Completeness from={from} to={to} />}
        <p className="mt-6 border-t border-slate-300 pt-3 text-sm text-slate-600">
          Reviewed by: ______________________ Date: __________ · CareMAR prototype output. Not validated for inspection or compliance purposes.
        </p>
      </Card>
    </div>
  );
}

function TallyHead() {
  return (
    <>
      <th className="px-2 py-1.5">Scheduled</th>
      <th className="px-2 py-1.5">Given</th>
      <th className="px-2 py-1.5">Refused</th>
      <th className="px-2 py-1.5">Held</th>
      <th className="px-2 py-1.5">Not given</th>
      <th className="px-2 py-1.5">Undocumented</th>
      <th className="px-2 py-1.5">Not yet due</th>
      <th className="px-2 py-1.5">Complete</th>
    </>
  );
}
function TallyCells({ t }: { t: Tally }) {
  return (
    <>
      <td className="px-2 py-1.5">{t.scheduled}</td>
      <td className="px-2 py-1.5">{t.administered}</td>
      <td className="px-2 py-1.5">{t.refused}</td>
      <td className="px-2 py-1.5">{t.held}</td>
      <td className="px-2 py-1.5">{t.not_administered}</td>
      <td className={`px-2 py-1.5 ${t.undocumented ? "font-bold text-red-700" : ""}`}>{t.undocumented}</td>
      <td className="px-2 py-1.5">{t.pending}</td>
      <td className="px-2 py-1.5 font-semibold">{pct(t)}</td>
    </>
  );
}
const tableCls = "w-full min-w-[640px] border-collapse text-left text-sm [&_td]:border-b [&_td]:border-slate-200 [&_th]:bg-slate-100 [&_th]:text-xs [&_th]:uppercase";

function Daily({ date, staffName }: { date: string; staffName: (id: string) => string }) {
  const { state, now } = useDemo();
  const d = dailySummary(state, date, now);
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className="px-2 py-1.5">Resident</th>
              <th className="px-2 py-1.5">Room</th>
              <TallyHead />
            </tr>
          </thead>
          <tbody>
            {d.residents.map((r) => (
              <tr key={r.residentId}>
                <td className="px-2 py-1.5 font-semibold">{r.label}</td>
                <td className="px-2 py-1.5">{r.room}</td>
                <TallyCells t={r.tally} />
              </tr>
            ))}
            <tr className="font-bold">
              <td className="px-2 py-1.5">Total</td>
              <td />
              <TallyCells t={d.total} />
            </tr>
          </tbody>
        </table>
      </div>
      {d.residents.map((r, i) => (
        <div key={r.residentId} className={i > 0 ? "print-break" : undefined}>
          <h3 className="mb-1 text-lg font-bold">
            {r.label} — Room {r.room}
          </h3>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className="px-2 py-1.5">Time</th>
                  <th className="px-2 py-1.5">Medication</th>
                  <th className="px-2 py-1.5">Dose / route</th>
                  <th className="px-2 py-1.5">Outcome</th>
                  <th className="px-2 py-1.5">Staff</th>
                  <th className="px-2 py-1.5">Recorded</th>
                  <th className="px-2 py-1.5">Reason / note</th>
                </tr>
              </thead>
              <tbody>
                {r.doses.map((v) => (
                  <tr key={v.id}>
                    <td className="px-2 py-1.5">{fmtHHMM(v.time)}</td>
                    <td className="px-2 py-1.5">
                      {v.order.name} {v.order.strength}
                    </td>
                    <td className="px-2 py-1.5">
                      {v.order.dose}, {v.order.route}
                    </td>
                    <td className="px-2 py-1.5">{v.record ? OUTCOME_LABEL[v.record.outcome] : v.status === "overdue" ? <b className="text-red-700">NOT DOCUMENTED</b> : "Not yet due"}</td>
                    <td className="px-2 py-1.5">{v.record ? staffName(v.record.staffId) : ""}</td>
                    <td className="px-2 py-1.5">
                      {v.record ? fmtTime(v.record.recordedAt) : ""}
                      {v.history.length > 1 && " (corrected)"}
                    </td>
                    <td className="px-2 py-1.5">{[v.record?.reason, v.record?.note].filter(Boolean).join(" — ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function Exceptions({ from, to, staffName }: { from: string; to: string; staffName: (id: string) => string }) {
  const { state, now } = useDemo();
  const list = exceptionsReport(state, from, to, now);
  if (list.length === 0) return <p>No missed, refused, held or undocumented doses in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className={tableCls}>
        <thead>
          <tr>
            <th className="px-2 py-1.5">Scheduled</th>
            <th className="px-2 py-1.5">Resident</th>
            <th className="px-2 py-1.5">Medication</th>
            <th className="px-2 py-1.5">Status</th>
            <th className="px-2 py-1.5">Reason / note</th>
            <th className="px-2 py-1.5">Staff</th>
            <th className="px-2 py-1.5">Supervisor review</th>
          </tr>
        </thead>
        <tbody>
          {list.map((v) => (
            <tr key={v.id}>
              <td className="px-2 py-1.5 whitespace-nowrap">{fmtDateTime(v.scheduledAt)}</td>
              <td className="px-2 py-1.5">
                {v.resident.lastName}, {v.resident.firstName} (Rm {v.resident.room})
              </td>
              <td className="px-2 py-1.5">
                {v.order.name} {v.order.strength}
              </td>
              <td className="px-2 py-1.5">{v.record ? OUTCOME_LABEL[v.record.outcome] : <StatusBadge status={v.status} />}</td>
              <td className="px-2 py-1.5">{[v.record?.reason, v.record?.note].filter(Boolean).join(" — ") || "No documentation"}</td>
              <td className="px-2 py-1.5">{v.record ? staffName(v.record.staffId) : "—"}</td>
              <td className="px-2 py-1.5">
                {v.reviews.length ? v.reviews.map((r) => `${r.action === "escalated" ? "Escalated" : "Reviewed"} by ${staffName(r.reviewerId)}`).join("; ") : "Pending"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Completeness({ from, to }: { from: string; to: string }) {
  const { state, now } = useDemo();
  const c = completenessReport(state, from, to, now);
  return (
    <div className="space-y-6">
      <p className="text-lg">
        Overall documentation completeness: <b className="text-2xl">{pct(c.total)}</b> ({c.total.scheduled - c.total.pending - c.total.undocumented} of{" "}
        {c.total.scheduled - c.total.pending} due doses documented; {c.total.undocumented} undocumented).
      </p>
      {(
        [
          ["By day", c.byDate.map(([d, t]) => [fmtDate(d), t] as const)],
          ["By shift", c.byShift.map(([s, t]) => [`${s} shift`, t] as const)],
          ["By resident", c.byResident.map((r) => [`${r.label} (Rm ${r.room})`, r.tally] as const)],
        ] as const
      ).map(([title, rows]) => (
        <div key={title}>
          <h3 className="mb-1 text-lg font-bold">{title}</h3>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className="px-2 py-1.5">{title.replace("By ", "")}</th>
                  <TallyHead />
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, t]) => (
                  <tr key={label}>
                    <td className="px-2 py-1.5 font-semibold">{label}</td>
                    <TallyCells t={t} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div>
        <h3 className="mb-1 text-lg font-bold">Entries by staff member</h3>
        <ul className="list-inside list-disc">
          {c.byStaff.map((s) => (
            <li key={s.name}>
              {s.name}: {s.count} records
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
