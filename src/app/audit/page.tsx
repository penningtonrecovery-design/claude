"use client";

import { useMemo, useState } from "react";
import { Download, ShieldCheck, ShieldX } from "lucide-react";
import { useDemo } from "@/lib/store";
import { auditToCsv, verifyAuditChain, type ChainCheck } from "@/lib/audit";
import { logReportGenerated } from "@/lib/actions";
import { fmtDateTime } from "@/lib/time";
import { ROLE_LABEL } from "@/lib/types";
import { Button, Card, PageHeader, inputCls } from "@/components/ui";
import { RequireRole } from "@/components/AppShell";
import { STATIC_DEMO } from "@/lib/env";

export default function AuditPage() {
  return (
    <RequireRole roles={["supervisor", "admin"]}>
      <AuditTrail />
    </RequireRole>
  );
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function AuditTrail() {
  const { state, run } = useDemo();
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [action, setAction] = useState("all");
  const [check, setCheck] = useState<ChainCheck | null>(null);
  const [limit, setLimit] = useState(100);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const copyCsv = async () => {
    run((s, a, t) => logReportGenerated(s, a.id, "audit-export", t));
    try {
      await navigator.clipboard.writeText(auditToCsv(state.audit, state.settings.facilityName));
      setCopyMsg("Audit log copied as CSV. Paste it into a spreadsheet.");
    } catch {
      setCopyMsg("Your browser blocked clipboard access. Run the app locally to download the export.");
    }
  };

  const actions = useMemo(() => [...new Set(state.audit.map((e) => e.action))].sort(), [state.audit]);
  const actors = useMemo(() => [...new Map(state.audit.map((e) => [e.actorId, e.actorName])).entries()], [state.audit]);
  const rows = state.audit
    .filter((e) => (actor === "all" || e.actorId === actor) && (action === "all" || e.action === action) && (!q || e.summary.toLowerCase().includes(q.toLowerCase())))
    .slice()
    .reverse();

  const exportAs = (fmt: "csv" | "json") => {
    run((s, a, t) => logReportGenerated(s, a.id, "audit-export", t));
    const stamp = new Date().toISOString().slice(0, 10);
    if (fmt === "csv") download(`caremar-DEMO-audit-${stamp}.csv`, auditToCsv(state.audit, state.settings.facilityName), "text/csv");
    else
      download(
        `caremar-DEMO-audit-${stamp}.json`,
        JSON.stringify({ notice: "DEMO PROTOTYPE EXPORT - NOT A VALIDATED COMPLIANCE SYSTEM - FICTIONAL DATA", facility: state.settings.facilityName, exportedAt: new Date().toISOString(), events: state.audit }, null, 2),
        "application/json",
      );
  };

  return (
    <div>
      <PageHeader
        title="Audit trail"
        subtitle={`${state.audit.length} append-only events · newest first`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCheck(verifyAuditChain(state.audit))}>
              <ShieldCheck className="h-5 w-5" aria-hidden /> Verify chain
            </Button>
            {STATIC_DEMO ? (
              <Button variant="secondary" onClick={copyCsv}>
                <Download className="h-5 w-5" aria-hidden /> Copy CSV export
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => exportAs("csv")}>
                  <Download className="h-5 w-5" aria-hidden /> Export CSV
                </Button>
                <Button variant="secondary" onClick={() => exportAs("json")}>
                  <Download className="h-5 w-5" aria-hidden /> Export JSON
                </Button>
              </>
            )}
          </>
        }
      />
      <Card className="mb-4 border-2 border-amber-400 bg-amber-50 p-4 text-slate-800">
        <b>Prototype audit log — not a production-validated compliance system.</b> Events are append-only in the app and linked with a demo hash chain so tampering can
        be detected. Data lives in this browser only; a production system needs server-side, write-once storage, cryptographic hashing, time synchronisation and
        independent validation.
      </Card>
      {copyMsg && (
        <div role="status" className="mb-4 rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 font-semibold text-blue-900">
          {copyMsg}
        </div>
      )}
      {check && (
        <div
          role="status"
          className={`mb-4 flex items-center gap-2 rounded-xl border-2 px-4 py-3 font-semibold ${check.ok ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-red-500 bg-red-50 text-red-900"}`}
        >
          {check.ok ? <ShieldCheck className="h-6 w-6" aria-hidden /> : <ShieldX className="h-6 w-6" aria-hidden />}
          {check.ok ? `Chain intact — all ${check.count} events verified.` : `Chain broken at event #${check.brokenAtSeq}: ${check.problem}.`}
        </div>
      )}
      <div className="no-print mb-4 grid gap-2 sm:grid-cols-3">
        <input aria-label="Search audit summaries" className={inputCls} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by staff" className={inputCls} value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="all">All staff</option>
          {actors.map(([id, n]) => (
            <option key={id} value={id}>
              {n}
            </option>
          ))}
        </select>
        <select aria-label="Filter by action" className={inputCls} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">All actions</option>
          {actions.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Who</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Summary</th>
              <th className="px-3 py-2">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.slice(0, limit).map((e) => (
              <tr key={e.id} className="align-top">
                <td className="px-3 py-2 text-slate-500">{e.seq}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(e.at)}</td>
                <td className="px-3 py-2">
                  <div className="font-semibold">{e.actorName}</div>
                  <div className="text-sm text-slate-500">{e.actorRole === "system" ? "System" : ROLE_LABEL[e.actorRole]}</div>
                </td>
                <td className="px-3 py-2">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{e.action}</code>
                </td>
                <td className="px-3 py-2">{e.summary}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500" title={`prev ${e.prevHash}`}>
                  {e.hash.slice(0, 8)}…
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {rows.length > limit && (
        <div className="mt-3 text-center">
          <Button variant="secondary" onClick={() => setLimit((l) => l + 200)}>
            Show more ({rows.length - limit} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
