// Fictional seed data. No real people, no real facility, no real prescriptions.
import { appendAudit, SYSTEM_ACTOR, type Actor } from "./audit";
import { doseIdFor, dosesForOrder } from "./doses";
import { MINUTE, addDays, atTime, dateKey, fmtDateTime } from "./time";
import {
  OUTCOME_LABEL,
  type AdministrationRecord,
  type AuditEvent,
  type DemoNotification,
  type DemoState,
  type MedicationOrder,
  type Outcome,
  type Resident,
  type ReviewRecord,
  type Staff,
} from "./types";

export const STATE_VERSION = 3;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R = (n: number) => `res_${n}`;

export function seedResidents(today: string): Resident[] {
  const admitted = (days: number) => addDays(today, -days);
  return [
    { id: R(1), firstName: "Eleanor", lastName: "Whitfield", room: "101", birthYear: 1938, allergies: ["Penicillin"], physician: "Dr. A. Fairbanks", notes: "Prefers medications with applesauce.", active: true, admittedOn: admitted(400) },
    { id: R(2), firstName: "Harold", lastName: "Brennan", preferredName: "Hal", room: "102", birthYear: 1941, allergies: [], physician: "Dr. A. Fairbanks", active: true, admittedOn: admitted(220) },
    { id: R(3), firstName: "Margaret", lastName: "Osei", room: "103", birthYear: 1935, allergies: ["Sulfa drugs"], physician: "Dr. N. Halvorsen", notes: "Hard of hearing — face resident when speaking.", active: true, admittedOn: admitted(610) },
    { id: R(4), firstName: "Walter", lastName: "Lindqvist", room: "104", birthYear: 1944, allergies: [], physician: "Dr. N. Halvorsen", active: true, admittedOn: admitted(95) },
    { id: R(5), firstName: "Rosa", lastName: "Delgado-Pham", room: "105", birthYear: 1940, allergies: ["Codeine"], physician: "Dr. A. Fairbanks", notes: "Spanish-speaking; family visits Sundays.", active: true, admittedOn: admitted(330) },
    { id: R(6), firstName: "Frank", lastName: "Abernathy", room: "106", birthYear: 1937, allergies: ["Latex"], physician: "Dr. P. Mbeki", active: true, admittedOn: admitted(140) },
    { id: R(7), firstName: "Beatrice", lastName: "Kowalczyk", preferredName: "Bea", room: "107", birthYear: 1943, allergies: [], physician: "Dr. P. Mbeki", active: true, admittedOn: admitted(510) },
    { id: R(8), firstName: "George", lastName: "Tanaka-Reyes", room: "108", birthYear: 1939, allergies: ["Aspirin (GI upset)"], physician: "Dr. N. Halvorsen", active: true, admittedOn: admitted(60) },
  ];
}

export function seedStaff(): Staff[] {
  const all = [1, 2, 3, 4, 5, 6, 7, 8].map(R);
  return [
    { id: "stf_maria", name: "Maria Santos", role: "caregiver", title: "Caregiver — Day shift", active: true, assignedResidentIds: all.slice(0, 4) },
    { id: "stf_james", name: "James Okafor", role: "caregiver", title: "Caregiver — Day shift", active: true, assignedResidentIds: all.slice(4) },
    { id: "stf_priya", name: "Priya Nair", role: "caregiver", title: "Caregiver — Evening shift", active: true, assignedResidentIds: all },
    { id: "stf_linda", name: "Linda Chen", role: "supervisor", title: "Care Supervisor", active: true, assignedResidentIds: [] },
    { id: "stf_david", name: "David Brooks", role: "admin", title: "Facility Administrator", active: true, assignedResidentIds: [] },
    { id: "stf_tom", name: "Tom Reilly", role: "caregiver", title: "Caregiver — former employee", active: false, assignedResidentIds: [] },
  ];
}

type O = Omit<MedicationOrder, "id" | "status" | "startDate" | "prescriber"> & { key: string; discontinuedDaysAgo?: number; discontinuedReason?: string };

export function seedOrders(today: string, residents: Resident[]): MedicationOrder[] {
  const list: O[] = [
    // Eleanor
    { key: "o1", residentId: R(1), name: "Lisinopril", strength: "10 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "Give with water.", indication: "Blood pressure" },
    { key: "o2", residentId: R(1), name: "Donepezil", strength: "5 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["20:00"], instructions: "Give at bedtime.", indication: "Memory" },
    { key: "o3", residentId: R(1), name: "Calcium carbonate + Vitamin D3", strength: "600 mg / 400 IU", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00", "17:00"], instructions: "Give with meals.", indication: "Supplement" },
    { key: "o4", residentId: R(1), name: "Simvastatin", strength: "20 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["20:00"], instructions: "Give in the evening.", indication: "Cholesterol", discontinuedDaysAgo: 6, discontinuedReason: "Discontinued by prescriber (fictional order change)" },
    // Harold
    { key: "o5", residentId: R(2), name: "Metformin", strength: "500 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00", "17:00"], instructions: "Give with meals.", indication: "Blood sugar" },
    { key: "o6", residentId: R(2), name: "Atorvastatin", strength: "20 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["20:00"], instructions: "", indication: "Cholesterol" },
    { key: "o7", residentId: R(2), name: "Tamsulosin", strength: "0.4 mg", form: "Capsule", dose: "1 capsule", route: "By mouth", times: ["20:00"], instructions: "Do not crush or open capsule.", indication: "Urinary" },
    // Margaret
    { key: "o8", residentId: R(3), name: "Levothyroxine", strength: "50 mcg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["07:00"], instructions: "Give on an empty stomach, 30 minutes before breakfast.", indication: "Thyroid" },
    { key: "o9", residentId: R(3), name: "Amlodipine", strength: "5 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "", indication: "Blood pressure" },
    { key: "o10", residentId: R(3), name: "Sertraline", strength: "50 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "", indication: "Mood" },
    { key: "o11", residentId: R(3), name: "Acetaminophen", strength: "500 mg", form: "Tablet", dose: "2 tablets", route: "By mouth", times: ["12:00", "20:00"], instructions: "Scheduled dose per order on file.", indication: "Arthritis pain" },
    // Walter
    { key: "o12", residentId: R(4), name: "Metoprolol tartrate", strength: "25 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00", "20:00"], instructions: "Follow pulse-check protocol on file before giving.", indication: "Heart" },
    { key: "o13", residentId: R(4), name: "Apixaban", strength: "2.5 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00", "20:00"], instructions: "", indication: "Anticoagulation" },
    { key: "o14", residentId: R(4), name: "Furosemide", strength: "20 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "Give in the morning.", indication: "Fluid" },
    { key: "o15", residentId: R(4), name: "Omeprazole", strength: "20 mg", form: "Capsule", dose: "1 capsule", route: "By mouth", times: ["08:00"], instructions: "Before breakfast.", indication: "Stomach", discontinuedDaysAgo: 3, discontinuedReason: "Discontinued by prescriber (fictional order change)" },
    // Rosa
    { key: "o16", residentId: R(5), name: "Memantine", strength: "10 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00", "20:00"], instructions: "", indication: "Memory" },
    { key: "o17", residentId: R(5), name: "Vitamin D3", strength: "1000 IU", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "", indication: "Supplement" },
    { key: "o18", residentId: R(5), name: "Polyethylene glycol 3350", strength: "17 g", form: "Powder", dose: "17 g in 8 oz water", route: "By mouth", times: ["08:00"], instructions: "Mix fully before giving.", indication: "Bowel regimen" },
    { key: "o19", residentId: R(5), name: "Mirtazapine", strength: "15 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["20:00"], instructions: "Give at bedtime.", indication: "Mood / sleep" },
    // Frank
    { key: "o20", residentId: R(6), name: "Losartan", strength: "50 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "", indication: "Blood pressure" },
    { key: "o21", residentId: R(6), name: "Gabapentin", strength: "100 mg", form: "Capsule", dose: "1 capsule", route: "By mouth", times: ["08:00", "12:00", "20:00"], instructions: "", indication: "Nerve pain" },
    { key: "o22", residentId: R(6), name: "Docusate sodium", strength: "100 mg", form: "Capsule", dose: "1 capsule", route: "By mouth", times: ["20:00"], instructions: "", indication: "Bowel regimen" },
    // Bea
    { key: "o23", residentId: R(7), name: "Pantoprazole", strength: "40 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["07:00"], instructions: "Do not crush. Before breakfast.", indication: "Stomach" },
    { key: "o24", residentId: R(7), name: "Carbidopa / Levodopa", strength: "25 mg / 100 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00", "12:00", "17:00", "20:00"], instructions: "Time-sensitive: give at scheduled times.", indication: "Parkinson's" },
    { key: "o25", residentId: R(7), name: "Senna", strength: "8.6 mg", form: "Tablet", dose: "2 tablets", route: "By mouth", times: ["20:00"], instructions: "", indication: "Bowel regimen" },
    // George
    { key: "o26", residentId: R(8), name: "Glipizide", strength: "5 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["08:00"], instructions: "Give 30 minutes before breakfast.", indication: "Blood sugar" },
    { key: "o27", residentId: R(8), name: "Melatonin", strength: "3 mg", form: "Tablet", dose: "1 tablet", route: "By mouth", times: ["20:00"], instructions: "", indication: "Sleep" },
    { key: "o28", residentId: R(8), name: "Latanoprost 0.005% eye drops", strength: "0.005%", form: "Solution", dose: "1 drop each eye", route: "Eye (ophthalmic)", times: ["20:00"], instructions: "Wait 5 minutes between different eye drops.", indication: "Eye pressure" },
  ];
  const physician = new Map(residents.map((r) => [r.id, r.physician]));
  return list.map(({ key, discontinuedDaysAgo, discontinuedReason, ...o }) => ({
    ...o,
    id: `ord_${key}`,
    prescriber: physician.get(o.residentId) ?? "Dr. (fictional)",
    startDate: addDays(today, -60),
    status: discontinuedDaysAgo ? "discontinued" : "active",
    discontinuedAt: discontinuedDaysAgo ? atTime(addDays(today, -discontinuedDaysAgo), "10:00") : undefined,
    discontinuedReason,
  }));
}

/** Builds a complete, internally consistent demo state anchored to `now`. */
export function createSeedState(now: number): DemoState {
  const rng = mulberry32(20261110);
  const today = dateKey(now);
  const residents = seedResidents(today);
  const staff = seedStaff();
  const orders = seedOrders(today, residents);
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const windowMin = 60;

  const records: AdministrationRecord[] = [];
  const reviews: ReviewRecord[] = [];
  let recCounter = 0;
  const recId = () => `rec_seed_${++recCounter}`;

  const caregiverFor = (residentId: string, time: string, date: string) => {
    const h = Number(time.slice(0, 2));
    if (date === addDays(today, -3) && h < 14) return "stf_tom";
    if (h >= 14) return "stf_priya";
    return Number(residentId.slice(4)) <= 4 ? "stf_maria" : "stf_james";
  };

  // Hand-picked scenarios so the supervisor dashboard and AI assistant always have something to show.
  const y = addDays(today, -1);
  const d2 = addDays(today, -2);
  type Scenario = { outcome?: Outcome; reason?: string; note?: string; lateMin?: number; missing?: boolean; staffId?: string };
  const scenarios = new Map<string, Scenario>([
    [doseIdFor("ord_o12", y, "20:00"), { outcome: "refused", reason: "Resident declined", note: "Said he felt tired. Offered again 20:30 and declined." }],
    [doseIdFor("ord_o11", d2, "12:00"), { outcome: "refused", reason: "Resident declined", note: "Re-offered after lunch; declined." }],
    [doseIdFor("ord_o21", y, "12:00"), { outcome: "held", reason: "Held per prescriber instruction on file" }],
    [doseIdFor("ord_o24", y, "17:00"), { missing: true }],
    [doseIdFor("ord_o27", d2, "20:00"), { missing: true }],
    [doseIdFor("ord_o16", y, "08:00"), { outcome: "administered", lateMin: 185 }],
    [doseIdFor("ord_o23", d2, "07:00"), { outcome: "refused", reason: "Resident declined", note: "Said stomach felt fine." }],
    [doseIdFor("ord_o23", y, "07:00"), { outcome: "refused", reason: "Resident declined" }],
    [doseIdFor("ord_o19", y, "20:00"), { outcome: "not_administered", reason: "Medication not available", note: "Pharmacy delivery expected tomorrow (fictional)." }],
  ]);

  const historyStart = addDays(today, -3);
  const lastDocumentable = now - (windowMin - 15) * MINUTE; // leave the most recent doses pending/due
  const corrections: AdministrationRecord[] = [];

  for (let d = historyStart; d <= today; d = addDays(d, 1)) {
    for (const order of orders) {
      for (const dose of dosesForOrder(order, d)) {
        if (dose.scheduledAt > lastDocumentable) continue;
        const sc = scenarios.get(dose.id);
        const roll = rng();
        if (sc?.missing) continue;
        if (!sc && d === today && roll < 0.08) continue; // a few overdue today
        if (!sc && d !== today && roll < 0.015) continue; // occasional missed documentation
        let outcome: Outcome = sc?.outcome ?? "administered";
        let reason = sc?.reason;
        if (!sc && roll > 0.985) {
          outcome = "refused";
          reason = "Resident declined";
        }
        const offset = sc?.lateMin ?? Math.round(-10 + rng() * 45);
        const staffId = sc?.staffId ?? caregiverFor(order.residentId, dose.time, d);
        records.push({
          id: recId(),
          doseId: dose.id,
          orderId: order.id,
          residentId: order.residentId,
          scheduledAt: dose.scheduledAt,
          outcome,
          reason,
          note: sc?.note,
          staffId,
          recordedAt: Math.min(dose.scheduledAt + offset * MINUTE, now - MINUTE),
        });
      }
    }
  }

  // A record documented against an order after it was discontinued (e.g. imported from a paper MAR) — an inconsistency to flag.
  const omeprazoleDose = doseIdFor("ord_o15", y, "08:00");
  records.push({
    id: recId(),
    doseId: omeprazoleDose,
    orderId: "ord_o15",
    residentId: R(4),
    scheduledAt: atTime(y, "08:00"),
    outcome: "administered",
    staffId: "stf_maria",
    recordedAt: atTime(y, "08:20"),
    note: "Entered from paper MAR sheet.",
  });

  // A correction: an administered record later corrected to refused (both are kept).
  const toCorrect = records.find((r) => r.doseId === doseIdFor("ord_o5", d2, "17:00"));
  if (toCorrect) {
    corrections.push({
      ...toCorrect,
      id: recId(),
      outcome: "refused",
      reason: "Resident declined",
      note: "Resident declined at dinner.",
      staffId: "stf_priya",
      recordedAt: toCorrect.recordedAt + 55 * MINUTE,
      supersedesId: toCorrect.id,
      correctionReason: "Documented on the wrong row; this dose was actually declined.",
    });
  }

  // Supervisor already reviewed one older exception.
  const reviewedDose = doseIdFor("ord_o11", d2, "12:00");
  reviews.push({ id: "rev_seed_1", doseId: reviewedDose, reviewerId: "stf_linda", at: atTime(d2, "15:10"), action: "acknowledged", note: "Discussed with caregiver. Family informed per facility policy (simulated)." });

  const allRecords = [...records, ...corrections];

  // Build the audit log chronologically from the seeded history.
  type Pending = { at: number; actor: Actor; build: (a: AuditEvent[]) => AuditEvent[] };
  const events: Pending[] = [];
  const ordersById = new Map(orders.map((o) => [o.id, o]));
  const resById = new Map(residents.map((r) => [r.id, r]));
  const actor = (id: string): Actor => {
    const s = staffById.get(id)!;
    return { id: s.id, name: s.name, role: s.role };
  };
  for (const o of orders.filter((o) => o.discontinuedAt)) {
    events.push({
      at: o.discontinuedAt!,
      actor: actor("stf_david"),
      build: (a) => appendAudit(a, { actor: actor("stf_david"), at: o.discontinuedAt!, action: "order.discontinued", entityType: "order", entityId: o.id, summary: `Discontinued ${o.name} ${o.strength}. Reason: ${o.discontinuedReason}` }),
    });
  }
  for (const r of allRecords) {
    const o = ordersById.get(r.orderId)!;
    const res = resById.get(r.residentId)!;
    events.push({
      at: r.recordedAt,
      actor: actor(r.staffId),
      build: (a) =>
        appendAudit(a, {
          actor: actor(r.staffId),
          at: r.recordedAt,
          action: r.supersedesId ? "record.corrected" : "dose.documented",
          entityType: "record",
          entityId: r.id,
          summary: r.supersedesId
            ? `Correction: Administered → ${OUTCOME_LABEL[r.outcome]} for ${o.name} (original record ${r.supersedesId} retained)`
            : `${OUTCOME_LABEL[r.outcome]}: ${o.name} ${o.strength} for ${res.firstName} ${res.lastName} (scheduled ${fmtDateTime(r.scheduledAt)})`,
          data: { doseId: r.doseId, residentId: r.residentId, orderId: r.orderId, outcome: r.outcome, reason: r.reason, note: r.note, ...(r.supersedesId ? { supersedes: r.supersedesId, correctionReason: r.correctionReason } : {}) },
        }),
    });
  }
  for (const rv of reviews) {
    events.push({
      at: rv.at,
      actor: actor(rv.reviewerId),
      build: (a) => appendAudit(a, { actor: actor(rv.reviewerId), at: rv.at, action: "review.acknowledged", entityType: "dose", entityId: rv.doseId, summary: "Reviewed refused dose", data: { note: rv.note } }),
    });
  }
  events.sort((a, b) => a.at - b.at);
  let audit: AuditEvent[] = [];
  for (const e of events) audit = e.build(audit);
  audit = appendAudit(audit, {
    actor: SYSTEM_ACTOR,
    at: now,
    action: "demo.seeded",
    entityType: "system",
    entityId: "seed",
    summary: "Fictional demo data generated (history above was simulated at seed time)",
  });

  // Notifications for exceptions that are still awaiting review.
  const reviewed = new Set(reviews.map((r) => r.doseId));
  const notifications: DemoNotification[] = allRecords
    .filter((r) => r.outcome !== "administered" && !reviewed.has(r.doseId) && !allRecords.some((x) => x.supersedesId === r.id))
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .map((r) => {
      const o = ordersById.get(r.orderId)!;
      const res = resById.get(r.residentId)!;
      return {
        id: `ntf_seed_${r.id}`,
        createdAt: r.recordedAt,
        toRole: "supervisor" as const,
        kind: "exception" as const,
        doseId: r.doseId,
        title: `${OUTCOME_LABEL[r.outcome]} dose needs review`,
        body: `${staffById.get(r.staffId)?.name} recorded ${OUTCOME_LABEL[r.outcome].toLowerCase()} for ${o.name} — ${res.firstName} ${res.lastName}, Room ${res.room}. Reason: ${r.reason}.`,
        readBy: [],
      };
    });

  return {
    version: STATE_VERSION,
    seededAt: now,
    settings: { facilityName: "Maple Grove Residential Care (Fictional)", documentationWindowMinutes: windowMin },
    staff,
    residents,
    orders,
    records: allRecords,
    reviews,
    notifications,
    audit,
    sessionStaffId: null,
  };
}
