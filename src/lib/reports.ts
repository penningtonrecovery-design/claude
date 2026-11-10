import { buildDoseViews } from "./doses";
import { shiftFor, type Shift } from "./time";
import type { DemoState, DoseView, Outcome } from "./types";

export interface Tally {
  scheduled: number;
  administered: number;
  refused: number;
  held: number;
  not_administered: number;
  undocumented: number; // overdue / missing
  pending: number; // not yet due
}

const emptyTally = (): Tally => ({ scheduled: 0, administered: 0, refused: 0, held: 0, not_administered: 0, undocumented: 0, pending: 0 });

function add(t: Tally, v: DoseView) {
  t.scheduled++;
  if (v.record) t[v.record.outcome as Outcome]++;
  else if (v.status === "overdue") t.undocumented++;
  else t.pending++;
}

/** Documentation completeness = documented (any outcome) / doses that are past their window or already documented. */
export function completeness(t: Tally): number | null {
  const due = t.scheduled - t.pending;
  if (due <= 0) return null;
  return (due - t.undocumented) / due;
}

export function dailySummary(state: DemoState, date: string, now: number) {
  const views = buildDoseViews(state, date, date, now);
  const total = emptyTally();
  const byResident = new Map<string, { residentId: string; label: string; room: string; tally: Tally; doses: DoseView[] }>();
  for (const v of views) {
    add(total, v);
    const key = v.residentId;
    if (!byResident.has(key)) byResident.set(key, { residentId: key, label: `${v.resident.lastName}, ${v.resident.firstName}`, room: v.resident.room, tally: emptyTally(), doses: [] });
    const row = byResident.get(key)!;
    add(row.tally, v);
    row.doses.push(v);
  }
  return { date, total, residents: [...byResident.values()].sort((a, b) => a.room.localeCompare(b.room)), views };
}

export function exceptionsReport(state: DemoState, from: string, to: string, now: number) {
  const views = buildDoseViews(state, from, to, now);
  return views.filter((v) => v.status === "exception" || v.status === "overdue");
}

export function completenessReport(state: DemoState, from: string, to: string, now: number) {
  const views = buildDoseViews(state, from, to, now);
  const total = emptyTally();
  const byDate = new Map<string, Tally>();
  const byShift = new Map<Shift, Tally>();
  const byResident = new Map<string, { label: string; room: string; tally: Tally }>();
  const byStaff = new Map<string, number>();
  for (const v of views) {
    add(total, v);
    if (!byDate.has(v.date)) byDate.set(v.date, emptyTally());
    add(byDate.get(v.date)!, v);
    const sh = shiftFor(v.time);
    if (!byShift.has(sh)) byShift.set(sh, emptyTally());
    add(byShift.get(sh)!, v);
    if (!byResident.has(v.residentId)) byResident.set(v.residentId, { label: `${v.resident.lastName}, ${v.resident.firstName}`, room: v.resident.room, tally: emptyTally() });
    add(byResident.get(v.residentId)!.tally, v);
    if (v.record) byStaff.set(v.record.staffId, (byStaff.get(v.record.staffId) ?? 0) + 1);
  }
  return {
    total,
    byDate: [...byDate.entries()],
    byShift: (["Day", "Evening", "Night"] as Shift[]).filter((s) => byShift.has(s)).map((s) => [s, byShift.get(s)!] as const),
    byResident: [...byResident.values()].sort((a, b) => a.room.localeCompare(b.room)),
    byStaff: [...byStaff.entries()].map(([id, n]) => ({ name: state.staff.find((s) => s.id === id)?.name ?? id, count: n })).sort((a, b) => b.count - a.count),
  };
}
