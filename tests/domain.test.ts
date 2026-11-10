import { describe, expect, it } from "vitest";
import { createSeedState } from "@/lib/seed";
import { buildDoseViews, computeStatus, doseIdFor, effectiveRecord, getDoseView, todayViews } from "@/lib/doses";
import { correctRecord, discontinueOrder, documentDose, reviewException, addOrder, addResident } from "@/lib/actions";
import { verifyAuditChain, auditToCsv } from "@/lib/audit";
import { runAssistant, rulesSummary, containsClinicalAdvice } from "@/lib/assistant";
import { completeness, dailySummary } from "@/lib/reports";
import { atTime, dateKey, MINUTE } from "@/lib/time";
import type { DemoState } from "@/lib/types";

// Fixed "now": 2026-03-10 13:30 local time.
const NOW = new Date(2026, 2, 10, 13, 30).getTime();
const TODAY = dateKey(NOW);
const fresh = (): DemoState => createSeedState(NOW);

/** First undocumented dose today for a resident Maria is assigned to, due around now. */
function pendingDoseForMaria(s: DemoState) {
  const maria = s.staff.find((x) => x.id === "stf_maria")!;
  const v = todayViews(s, NOW).find((d) => !d.record && maria.assignedResidentIds.includes(d.residentId) && d.scheduledAt <= NOW + 60 * MINUTE);
  if (!v) throw new Error("no pending dose in seed");
  return v;
}

describe("dose status", () => {
  const W = 60;
  const sched = atTime(TODAY, "12:00");
  it("is pending before the window and due within it", () => {
    expect(computeStatus(sched, undefined, sched - 90 * MINUTE, W)).toEqual({ status: "pending", dueNow: false });
    expect(computeStatus(sched, undefined, sched - 30 * MINUTE, W)).toEqual({ status: "pending", dueNow: true });
    expect(computeStatus(sched, undefined, sched + 59 * MINUTE, W).status).toBe("pending");
  });
  it("becomes overdue after the documentation window", () => {
    expect(computeStatus(sched, undefined, sched + 61 * MINUTE, W).status).toBe("overdue");
  });
  it("is documented for administered and exception for refused/held/not administered", () => {
    const base = { id: "r", doseId: "d", orderId: "o", residentId: "x", scheduledAt: sched, staffId: "s", recordedAt: sched };
    expect(computeStatus(sched, { ...base, outcome: "administered" }, sched + 999 * MINUTE, W).status).toBe("documented");
    for (const outcome of ["refused", "held", "not_administered"] as const) {
      expect(computeStatus(sched, { ...base, outcome, reason: "x" }, sched, W).status).toBe("exception");
    }
  });
});

describe("documentation workflow", () => {
  it("requires explicit confirmation and never saves without it", () => {
    const s = fresh();
    const v = pendingDoseForMaria(s);
    expect(() => documentDose(s, "stf_maria", { doseId: v.id, outcome: "administered", confirmed: false }, NOW)).toThrow(/confirmation/i);
    expect(s.records.some((r) => r.doseId === v.id)).toBe(false);
  });

  it("records staff identity, timestamp and note, and appends an audit event", () => {
    const s = fresh();
    const v = pendingDoseForMaria(s);
    const next = documentDose(s, "stf_maria", { doseId: v.id, outcome: "administered", note: "Taken with water", confirmed: true }, NOW);
    const rec = next.records.at(-1)!;
    expect(rec).toMatchObject({ doseId: v.id, outcome: "administered", staffId: "stf_maria", recordedAt: NOW, note: "Taken with water" });
    expect(getDoseView(next, v.id, NOW)!.status).toBe("documented");
    expect(next.audit.length).toBe(s.audit.length + 1);
    expect(next.audit.at(-1)).toMatchObject({ action: "dose.documented", actorId: "stf_maria", at: NOW });
    // original state untouched (immutability)
    expect(s.records.length).toBe(next.records.length - 1);
  });

  it("requires a reason for refused / held / not administered and notifies the supervisor", () => {
    const s = fresh();
    const v = pendingDoseForMaria(s);
    expect(() => documentDose(s, "stf_maria", { doseId: v.id, outcome: "refused", confirmed: true }, NOW)).toThrow(/reason/i);
    expect(() => documentDose(s, "stf_maria", { doseId: v.id, outcome: "held", reason: "Other (explain in note)", confirmed: true }, NOW)).toThrow(/note/i);
    const next = documentDose(s, "stf_maria", { doseId: v.id, outcome: "refused", reason: "Resident declined", confirmed: true }, NOW);
    expect(getDoseView(next, v.id, NOW)!.status).toBe("exception");
    expect(next.notifications[0]).toMatchObject({ toRole: "supervisor", kind: "exception", doseId: v.id });
  });

  it("blocks double documentation, unassigned caregivers and inactive accounts", () => {
    const s = fresh();
    const v = pendingDoseForMaria(s);
    const once = documentDose(s, "stf_maria", { doseId: v.id, outcome: "administered", confirmed: true }, NOW);
    expect(() => documentDose(once, "stf_maria", { doseId: v.id, outcome: "administered", confirmed: true }, NOW)).toThrow(/already documented/i);
    expect(() => documentDose(s, "stf_james", { doseId: v.id, outcome: "administered", confirmed: true }, NOW)).toThrow(/not assigned/i);
    expect(() => documentDose(s, "stf_tom", { doseId: v.id, outcome: "administered", confirmed: true }, NOW)).toThrow(/deactivated/i);
  });

  it("does not generate doses for an order after it is discontinued", () => {
    const s = fresh();
    const v = todayViews(s, NOW).find((d) => d.time === "20:00" && d.order.status === "active")!;
    const next = discontinueOrder(s, "stf_david", v.orderId, "Fictional prescriber change", NOW);
    expect(todayViews(next, NOW).some((d) => d.id === v.id)).toBe(false);
    expect(() => discontinueOrder(s, "stf_maria", v.orderId, "x", NOW)).toThrow(/cannot/i);
  });
});

describe("corrections and audit history", () => {
  it("records a correction as a new record and keeps the original", () => {
    const s = fresh();
    const v = pendingDoseForMaria(s);
    const a = documentDose(s, "stf_maria", { doseId: v.id, outcome: "administered", confirmed: true }, NOW);
    const original = a.records.at(-1)!;
    expect(() => correctRecord(a, "stf_maria", { recordId: original.id, outcome: "refused", reason: "Resident declined", correctionReason: "", confirmed: true }, NOW + MINUTE)).toThrow(/correction reason/i);
    const b = correctRecord(a, "stf_maria", { recordId: original.id, outcome: "refused", reason: "Resident declined", correctionReason: "Wrong entry", confirmed: true }, NOW + MINUTE);
    expect(b.records.find((r) => r.id === original.id)).toEqual(original); // untouched
    const view = getDoseView(b, v.id, NOW + MINUTE)!;
    expect(view.history).toHaveLength(2);
    expect(view.record!.supersedesId).toBe(original.id);
    expect(view.status).toBe("exception");
    expect(b.audit.at(-1)!.action).toBe("record.corrected");
    // can't correct the superseded version again
    expect(() => correctRecord(b, "stf_maria", { recordId: original.id, outcome: "administered", correctionReason: "x", confirmed: true }, NOW)).toThrow(/already been corrected/i);
    // caregivers can't correct someone else's record
    expect(() => correctRecord(b, "stf_priya", { recordId: view.record!.id, outcome: "administered", correctionReason: "x", confirmed: true }, NOW)).toThrow(/own records/i);
  });

  it("effectiveRecord ignores superseded records", () => {
    const base = { doseId: "d", orderId: "o", residentId: "x", scheduledAt: 0, staffId: "s" };
    const r1 = { ...base, id: "1", outcome: "administered" as const, recordedAt: 1 };
    const r2 = { ...base, id: "2", outcome: "refused" as const, reason: "x", recordedAt: 2, supersedesId: "1" };
    expect(effectiveRecord([r1, r2])!.id).toBe("2");
  });

  it("is append-only and its hash chain detects tampering", () => {
    let s = fresh();
    expect(verifyAuditChain(s.audit).ok).toBe(true);
    const v = pendingDoseForMaria(s);
    const before = s.audit.slice();
    s = documentDose(s, "stf_maria", { doseId: v.id, outcome: "administered", confirmed: true }, NOW);
    expect(s.audit.slice(0, before.length)).toEqual(before); // earlier events unchanged
    expect(verifyAuditChain(s.audit).ok).toBe(true);

    const edited = s.audit.map((e, i) => (i === 3 ? { ...e, summary: "silently changed" } : e));
    expect(verifyAuditChain(edited)).toMatchObject({ ok: false, brokenAtSeq: 4 });
    const removed = [...s.audit.slice(0, 2), ...s.audit.slice(3)];
    expect(verifyAuditChain(removed).ok).toBe(false);
  });

  it("only supervisors/admins can review exceptions, and reviews are audited", () => {
    const s = fresh();
    const exc = buildDoseViews(s, "2000-01-01", TODAY, NOW).find((v) => v.status === "exception")!;
    expect(() => reviewException(s, "stf_maria", { doseId: exc.id, action: "acknowledged", note: "ok" }, NOW)).toThrow();
    const next = reviewException(s, "stf_linda", { doseId: exc.id, action: "escalated", note: "Please follow up", escalatedTo: "Administrator on call" }, NOW);
    expect(next.audit.at(-1)!.action).toBe("review.escalated");
    expect(next.notifications[0].kind).toBe("escalation");
  });

  it("exports CSV with a prototype label", () => {
    const csv = auditToCsv(fresh().audit, "Test");
    expect(csv.split("\n")[0]).toMatch(/DEMO PROTOTYPE/);
  });
});

describe("seed, reports and assistant", () => {
  it("seeds fictional residents with active and discontinued orders and an internally consistent audit log", () => {
    const s = fresh();
    expect(s.residents.length).toBeGreaterThanOrEqual(4);
    expect(s.orders.some((o) => o.status === "discontinued")).toBe(true);
    expect(verifyAuditChain(s.audit).ok).toBe(true);
    expect(s.records.every((r) => r.recordedAt <= NOW)).toBe(true);
  });

  it("assistant flags seeded documentation issues without clinical advice", () => {
    const s = fresh();
    const f = runAssistant(s, NOW);
    const rules = new Set(f.map((x) => x.rule));
    for (const r of ["missing-documentation", "exception-unreviewed", "late-entry", "record-after-discontinuation", "repeated-exceptions", "exception-without-note"]) {
      expect(rules.has(r), r).toBe(true);
    }
    for (const x of f) expect(containsClinicalAdvice(`${x.title}. ${x.detail}`), x.detail).toBe(false);
    expect(containsClinicalAdvice(rulesSummary(f))).toBe(false);
  });

  it("clinical-advice guard catches dosing/administration directions", () => {
    expect(containsClinicalAdvice("You should withhold the metoprolol dose tonight.")).toBe(true);
    expect(containsClinicalAdvice("Increase the dose to 50 mg.")).toBe(true);
    expect(containsClinicalAdvice("Do not give this tablet.")).toBe(true);
    expect(containsClinicalAdvice("Three records are missing documentation; please review them.")).toBe(false);
  });

  it("daily summary tallies match dose statuses", () => {
    const s = fresh();
    const d = dailySummary(s, TODAY, NOW);
    const t = d.total;
    expect(t.administered + t.refused + t.held + t.not_administered + t.undocumented + t.pending).toBe(t.scheduled);
    const c = completeness(t);
    expect(c === null || (c >= 0 && c <= 1)).toBe(true);
  });

  it("admin-only configuration is enforced", () => {
    const s = fresh();
    const input = { residentId: "res_1", name: "Test med", strength: "1 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["09:00"], instructions: "", indication: "", prescriber: "Dr. X", startDate: TODAY };
    expect(() => addOrder(s, "stf_linda", input, NOW)).toThrow();
    const next = addOrder(s, "stf_david", input, NOW);
    expect(next.orders.length).toBe(s.orders.length + 1);
    expect(() => addResident(s, "stf_maria", { firstName: "A", lastName: "B", room: "1", birthYear: 1940, allergies: [], physician: "", admittedOn: TODAY }, NOW)).toThrow();
  });

  it("dose ids are stable", () => {
    expect(doseIdFor("ord_x", "2026-01-02", "08:00")).toBe("ord_x@2026-01-02T08:00");
  });
});

import { chunkForSpeech, confirmAnnouncement, doseAnnouncement, savedAnnouncement, speakable } from "@/lib/speech";

describe("voice read-outs", () => {
  const s = createSeedState(NOW);
  const views = buildDoseViews(s, TODAY, TODAY, NOW);
  const withAllergy = views.find((v) => v.resident.allergies.length > 0)!;
  const noAllergy = views.find((v) => v.resident.allergies.length === 0)!;

  it("announces allergies first, then resident, room and the order as written", () => {
    const text = doseAnnouncement(withAllergy);
    expect(text.startsWith(`Allergy alert: ${withAllergy.resident.allergies.join(", ")}`)).toBe(true);
    expect(text).toContain(`room ${withAllergy.resident.room}`);
    expect(text).toContain(withAllergy.order.name);
    expect(doseAnnouncement(noAllergy).startsWith("No known allergies recorded.")).toBe(true);
  });

  it("expands units so they are spoken clearly", () => {
    expect(speakable("Levothyroxine 50 mcg, 500 mg, 17 g, 1000 IU, 0.005%")).toBe(
      "Levothyroxine 50 micrograms, 500 milligrams, 17 grams, 1000 international units, 0.005 percent",
    );
  });

  it("reads back the outcome before and after saving, without clinical advice", () => {
    const c = confirmAnnouncement(withAllergy, "refused", "Resident declined");
    expect(c).toMatch(/^Please confirm\. Refused\./);
    expect(c).toContain("Reason: Resident declined.");
    const done = savedAnnouncement(withAllergy, "administered", "Maria Santos");
    expect(done).toContain("Administered recorded for");
    for (const v of views) expect(containsClinicalAdvice(doseAnnouncement(v)), doseAnnouncement(v)).toBe(false);
    expect(containsClinicalAdvice(c)).toBe(false);
  });

  it("splits long text into short chunks", () => {
    const chunks = chunkForSpeech("One. Two two two. Three three three three.", 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ")).toBe("One. Two two two. Three three three three.");
  });
});
