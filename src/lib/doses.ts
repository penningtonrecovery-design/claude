import type { AdministrationRecord, DemoState, DoseStatus, DoseView, MedicationOrder, ScheduledDose } from "./types";
import { MINUTE, addDays, atTime, dateKey } from "./time";

export function doseIdFor(orderId: string, date: string, time: string): string {
  return `${orderId}@${date}T${time}`;
}

export function parseDoseId(doseId: string): { orderId: string; date: string; time: string } | null {
  const m = /^(.+)@(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(doseId);
  return m ? { orderId: m[1], date: m[2], time: m[3] } : null;
}

/** Was this order in effect (started and not yet discontinued) at the given moment? */
export function orderActiveAt(order: MedicationOrder, at: number): boolean {
  if (at < atTime(order.startDate, "00:00")) return false;
  if (order.status === "discontinued" && order.discontinuedAt !== undefined && at >= order.discontinuedAt) return false;
  return true;
}

/** Scheduled doses for one order on one date. Discontinued orders stop generating doses after discontinuation. */
export function dosesForOrder(order: MedicationOrder, date: string, recordedDoseIds?: Set<string>): ScheduledDose[] {
  const out: ScheduledDose[] = [];
  for (const time of [...order.times].sort()) {
    const scheduledAt = atTime(date, time);
    const id = doseIdFor(order.id, date, time);
    if (orderActiveAt(order, scheduledAt) || recordedDoseIds?.has(id)) {
      out.push({ id, orderId: order.id, residentId: order.residentId, date, time, scheduledAt });
    }
  }
  return out;
}

/** Current record for a dose: the latest record that no other record supersedes. */
export function effectiveRecord(records: readonly AdministrationRecord[]): AdministrationRecord | undefined {
  const superseded = new Set(records.map((r) => r.supersedesId).filter(Boolean) as string[]);
  const live = records.filter((r) => !superseded.has(r.id));
  return live.sort((a, b) => b.recordedAt - a.recordedAt)[0];
}

export function computeStatus(
  scheduledAt: number,
  record: AdministrationRecord | undefined,
  now: number,
  windowMinutes: number,
): { status: DoseStatus; dueNow: boolean } {
  if (record) return { status: record.outcome === "administered" ? "documented" : "exception", dueNow: false };
  const window = windowMinutes * MINUTE;
  if (now > scheduledAt + window) return { status: "overdue", dueNow: true };
  return { status: "pending", dueNow: now >= scheduledAt - window };
}

function indexBy<T, K>(items: readonly T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** All dose views for an inclusive range of dates. */
export function buildDoseViews(state: DemoState, fromDate: string, toDate: string, now: number): DoseView[] {
  const recordsByDose = indexBy(state.records, (r) => r.doseId);
  const reviewsByDose = indexBy(state.reviews, (r) => r.doseId);
  const recorded = new Set(recordsByDose.keys());
  const residents = new Map(state.residents.map((r) => [r.id, r]));
  const views: DoseView[] = [];
  for (let d = fromDate; d <= toDate; d = addDays(d, 1)) {
    for (const order of state.orders) {
      const resident = residents.get(order.residentId);
      if (!resident) continue;
      for (const dose of dosesForOrder(order, d, recorded)) {
        const history = [...(recordsByDose.get(dose.id) ?? [])].sort((a, b) => a.recordedAt - b.recordedAt);
        if (!resident.active && history.length === 0) continue;
        const record = effectiveRecord(history);
        const { status, dueNow } = computeStatus(dose.scheduledAt, record, now, state.settings.documentationWindowMinutes);
        views.push({ ...dose, status, dueNow, order, resident, record, history, reviews: reviewsByDose.get(dose.id) ?? [] });
      }
    }
  }
  return views.sort((a, b) => a.scheduledAt - b.scheduledAt || a.resident.room.localeCompare(b.resident.room));
}

export function getDoseView(state: DemoState, doseId: string, now: number): DoseView | undefined {
  const p = parseDoseId(doseId);
  if (!p) return undefined;
  return buildDoseViews(state, p.date, p.date, now).find((v) => v.id === doseId);
}

export function todayViews(state: DemoState, now: number): DoseView[] {
  const today = dateKey(now);
  return buildDoseViews(state, today, today, now);
}

export function countByStatus(views: readonly DoseView[]) {
  const c = { pending: 0, dueNow: 0, documented: 0, overdue: 0, exception: 0, total: views.length };
  for (const v of views) {
    c[v.status]++;
    if (v.status === "pending" && v.dueNow) c.dueNow++;
  }
  return c;
}

export function needsReview(v: DoseView): boolean {
  if (v.status !== "exception" || !v.record) return false;
  const rec = v.record;
  return !v.reviews.some((r) => r.at >= rec.recordedAt);
}
