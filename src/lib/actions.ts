// Pure state transitions. Every function validates permissions and inputs,
// returns a NEW state, and appends an audit event. Nothing is ever deleted.
import { appendAudit, newId, type Actor } from "./audit";
import { getDoseView, orderActiveAt } from "./doses";
import {
  DemoRuleError,
  OUTCOME_LABEL,
  ROLE_LABEL,
  type AdministrationRecord,
  type DemoNotification,
  type DemoState,
  type MedicationOrder,
  type Outcome,
  type Resident,
  type Role,
  type Settings,
  type Staff,
} from "./types";
import { fmtDateTime } from "./time";

export const OUTCOMES: Outcome[] = ["administered", "refused", "held", "not_administered"];

/** Documentation reason choices. These describe what happened; they are never suggested by the system. */
export const REASONS: Record<Exclude<Outcome, "administered">, string[]> = {
  refused: ["Resident declined", "Resident spat out / did not swallow", "Other (explain in note)"],
  held: [
    "Held per prescriber instruction on file",
    "Held per facility protocol on file",
    "Resident out of facility",
    "Other (explain in note)",
  ],
  not_administered: [
    "Medication not available",
    "Resident asleep / unavailable",
    "Resident away (hospital / appointment)",
    "Other (explain in note)",
  ],
};

export function actorOf(staff: Staff): Actor {
  return { id: staff.id, name: staff.name, role: staff.role };
}

function requireActor(state: DemoState, actorId: string): Staff {
  const s = state.staff.find((x) => x.id === actorId);
  if (!s) throw new DemoRuleError("Unknown staff member.");
  if (!s.active) throw new DemoRuleError(`${s.name}'s account is deactivated.`);
  return s;
}

function requireRole(staff: Staff, roles: Role[], what: string) {
  if (!roles.includes(staff.role)) {
    throw new DemoRuleError(`${ROLE_LABEL[staff.role]} accounts cannot ${what}. Allowed: ${roles.map((r) => ROLE_LABEL[r]).join(", ")}.`);
  }
}

function notify(state: DemoState, n: Omit<DemoNotification, "id" | "readBy">): DemoState {
  return { ...state, notifications: [{ ...n, id: newId("ntf"), readBy: [] }, ...state.notifications] };
}

// ---------------------------------------------------------------- sessions

export function login(state: DemoState, staffId: string, now: number): DemoState {
  const staff = requireActor(state, staffId);
  const audit = appendAudit(state.audit, {
    actor: actorOf(staff),
    at: now,
    action: "session.login",
    entityType: "session",
    entityId: staff.id,
    summary: `${staff.name} signed in (simulated, ${ROLE_LABEL[staff.role]})`,
  });
  return { ...state, sessionStaffId: staff.id, audit };
}

export function logout(state: DemoState, now: number): DemoState {
  const staff = state.staff.find((s) => s.id === state.sessionStaffId);
  if (!staff) return { ...state, sessionStaffId: null };
  const audit = appendAudit(state.audit, {
    actor: actorOf(staff),
    at: now,
    action: "session.logout",
    entityType: "session",
    entityId: staff.id,
    summary: `${staff.name} signed out`,
  });
  return { ...state, sessionStaffId: null, audit };
}

// ---------------------------------------------------------------- documentation

export interface DocumentInput {
  doseId: string;
  outcome: Outcome;
  reason?: string;
  note?: string;
  /** Must be explicitly true — the UI sets it only after the confirmation step. */
  confirmed: boolean;
}

function validateOutcome(input: { outcome: Outcome; reason?: string; note?: string }) {
  if (!OUTCOMES.includes(input.outcome)) throw new DemoRuleError("Choose what happened with this dose.");
  if (input.outcome !== "administered") {
    if (!input.reason) throw new DemoRuleError(`A reason is required when recording "${OUTCOME_LABEL[input.outcome]}".`);
    if (input.reason.startsWith("Other") && !input.note?.trim()) throw new DemoRuleError("Please explain in the note when choosing \"Other\".");
  }
}

export function canDocumentFor(staff: Staff, residentId: string): boolean {
  if (staff.role === "caregiver") return staff.assignedResidentIds.includes(residentId);
  return true;
}

export function documentDose(state: DemoState, actorId: string, input: DocumentInput, now: number): DemoState {
  const staff = requireActor(state, actorId);
  if (input.confirmed !== true) throw new DemoRuleError("Explicit confirmation is required before saving a record.");
  validateOutcome(input);
  const view = getDoseView(state, input.doseId, now);
  if (!view) throw new DemoRuleError("This scheduled dose does not exist.");
  if (!orderActiveAt(view.order, view.scheduledAt)) throw new DemoRuleError("This order was not active at the scheduled time.");
  if (view.record) throw new DemoRuleError("This dose is already documented. Use \"Correct record\" to change it.");
  if (!view.resident.active) throw new DemoRuleError("This resident is inactive.");
  if (!canDocumentFor(staff, view.residentId)) throw new DemoRuleError(`${staff.name} is not assigned to this resident.`);
  if (view.scheduledAt - now > 2 * 60 * 60_000) throw new DemoRuleError("Doses more than 2 hours in the future cannot be documented yet.");

  const record: AdministrationRecord = {
    id: newId("rec"),
    doseId: view.id,
    orderId: view.orderId,
    residentId: view.residentId,
    scheduledAt: view.scheduledAt,
    outcome: input.outcome,
    reason: input.outcome === "administered" ? undefined : input.reason,
    note: input.note?.trim() || undefined,
    staffId: staff.id,
    recordedAt: now,
  };
  const residentName = `${view.resident.firstName} ${view.resident.lastName}`;
  let next: DemoState = {
    ...state,
    records: [...state.records, record],
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "dose.documented",
      entityType: "record",
      entityId: record.id,
      summary: `${OUTCOME_LABEL[record.outcome]}: ${view.order.name} ${view.order.strength} for ${residentName} (scheduled ${fmtDateTime(view.scheduledAt)})`,
      data: { doseId: view.id, residentId: view.residentId, orderId: view.orderId, outcome: record.outcome, reason: record.reason, note: record.note },
    }),
  };
  if (record.outcome !== "administered") {
    next = notify(next, {
      createdAt: now,
      toRole: "supervisor",
      kind: "exception",
      doseId: view.id,
      title: `${OUTCOME_LABEL[record.outcome]} dose needs review`,
      body: `${staff.name} recorded ${OUTCOME_LABEL[record.outcome].toLowerCase()} for ${view.order.name} — ${residentName}, Room ${view.resident.room}. Reason: ${record.reason}.`,
    });
  }
  return next;
}

export interface CorrectInput {
  recordId: string;
  outcome: Outcome;
  reason?: string;
  note?: string;
  correctionReason: string;
  confirmed: boolean;
}

export function correctRecord(state: DemoState, actorId: string, input: CorrectInput, now: number): DemoState {
  const staff = requireActor(state, actorId);
  if (input.confirmed !== true) throw new DemoRuleError("Explicit confirmation is required before saving a correction.");
  if (!input.correctionReason?.trim()) throw new DemoRuleError("A correction reason is required.");
  validateOutcome(input);
  const original = state.records.find((r) => r.id === input.recordId);
  if (!original) throw new DemoRuleError("Original record not found.");
  if (state.records.some((r) => r.supersedesId === original.id)) throw new DemoRuleError("This record has already been corrected. Correct the latest version instead.");
  if (staff.role === "caregiver" && original.staffId !== staff.id) {
    throw new DemoRuleError("Caregivers can only correct their own records. Ask a supervisor.");
  }
  const record: AdministrationRecord = {
    ...original,
    id: newId("rec"),
    outcome: input.outcome,
    reason: input.outcome === "administered" ? undefined : input.reason,
    note: input.note?.trim() || undefined,
    staffId: staff.id,
    recordedAt: now,
    supersedesId: original.id,
    correctionReason: input.correctionReason.trim(),
  };
  const order = state.orders.find((o) => o.id === original.orderId);
  let next: DemoState = {
    ...state,
    records: [...state.records, record],
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "record.corrected",
      entityType: "record",
      entityId: record.id,
      summary: `Correction: ${OUTCOME_LABEL[original.outcome]} → ${OUTCOME_LABEL[record.outcome]} for ${order?.name ?? "medication"} (original record ${original.id} retained)`,
      data: { doseId: record.doseId, supersedes: original.id, from: original.outcome, to: record.outcome, correctionReason: record.correctionReason },
    }),
  };
  next = notify(next, {
    createdAt: now,
    toRole: "supervisor",
    kind: "info",
    doseId: record.doseId,
    title: "Record corrected",
    body: `${staff.name} corrected a record (${OUTCOME_LABEL[original.outcome]} → ${OUTCOME_LABEL[record.outcome]}). Reason: ${record.correctionReason}`,
  });
  return next;
}

// ---------------------------------------------------------------- supervisor workflow

export function reviewException(
  state: DemoState,
  actorId: string,
  input: { doseId: string; action: "acknowledged" | "escalated"; note: string; escalatedTo?: string },
  now: number,
): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["supervisor", "admin"], "review exceptions");
  if (!input.note.trim()) throw new DemoRuleError("A review note is required.");
  if (input.action === "escalated" && !input.escalatedTo) throw new DemoRuleError("Choose who to escalate to.");
  const view = getDoseView(state, input.doseId, now);
  if (!view) throw new DemoRuleError("Dose not found.");
  const review = { id: newId("rev"), doseId: input.doseId, reviewerId: staff.id, at: now, action: input.action, note: input.note.trim(), escalatedTo: input.escalatedTo };
  let next: DemoState = {
    ...state,
    reviews: [...state.reviews, review],
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: input.action === "escalated" ? "review.escalated" : "review.acknowledged",
      entityType: "dose",
      entityId: input.doseId,
      summary:
        input.action === "escalated"
          ? `Escalated ${view.order.name} for ${view.resident.firstName} ${view.resident.lastName} to ${input.escalatedTo} (simulated)`
          : `Reviewed ${view.status} for ${view.order.name} — ${view.resident.firstName} ${view.resident.lastName}`,
      data: { note: review.note, escalatedTo: input.escalatedTo },
    }),
  };
  if (input.action === "escalated") {
    next = notify(next, {
      createdAt: now,
      toRole: "admin",
      kind: "escalation",
      doseId: input.doseId,
      title: `Escalation to ${input.escalatedTo} (simulated)`,
      body: `${staff.name}: ${review.note} — ${view.order.name}, ${view.resident.firstName} ${view.resident.lastName}. No real message was sent.`,
    });
  }
  return next;
}

export function sendReminder(state: DemoState, actorId: string, doseId: string, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["supervisor", "admin"], "send documentation reminders");
  const view = getDoseView(state, doseId, now);
  if (!view) throw new DemoRuleError("Dose not found.");
  const caregivers = state.staff.filter((s) => s.active && s.role === "caregiver" && s.assignedResidentIds.includes(view.residentId));
  let next = state;
  for (const c of caregivers.length ? caregivers : []) {
    next = notify(next, {
      createdAt: now,
      toStaffId: c.id,
      kind: "reminder",
      doseId,
      title: "Documentation reminder",
      body: `${staff.name} asks you to complete documentation for ${view.order.name} — ${view.resident.firstName} ${view.resident.lastName}, Room ${view.resident.room} (scheduled ${fmtDateTime(view.scheduledAt)}).`,
    });
  }
  return {
    ...next,
    audit: appendAudit(next.audit, {
      actor: actorOf(staff),
      at: now,
      action: "reminder.sent",
      entityType: "dose",
      entityId: doseId,
      summary: `Documentation reminder sent to ${caregivers.map((c) => c.name).join(", ") || "no assigned caregiver"} (simulated, in-app only)`,
    }),
  };
}

export function markNotificationsRead(state: DemoState, staffId: string, ids: string[]): DemoState {
  const set = new Set(ids);
  return {
    ...state,
    notifications: state.notifications.map((n) => (set.has(n.id) && !n.readBy.includes(staffId) ? { ...n, readBy: [...n.readBy, staffId] } : n)),
  };
}

export function notificationsFor(state: DemoState, staff: Staff): DemoNotification[] {
  return state.notifications.filter(
    (n) => n.toStaffId === staff.id || (n.toRole && (n.toRole === staff.role || (staff.role === "admin" && n.toRole === "supervisor"))),
  );
}

// ---------------------------------------------------------------- administration (admin only)

export type ResidentInput = Omit<Resident, "id" | "active">;

function validateResident(input: ResidentInput) {
  if (!input.firstName.trim() || !input.lastName.trim()) throw new DemoRuleError("First and last name are required.");
  if (!input.room.trim()) throw new DemoRuleError("Room number is required.");
}

export function addResident(state: DemoState, actorId: string, input: ResidentInput, now: number): { state: DemoState; id: string } {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "add residents");
  validateResident(input);
  const resident: Resident = { ...input, id: newId("res"), active: true };
  return {
    id: resident.id,
    state: {
      ...state,
      residents: [...state.residents, resident],
      audit: appendAudit(state.audit, {
        actor: actorOf(staff),
        at: now,
        action: "resident.created",
        entityType: "resident",
        entityId: resident.id,
        summary: `Added fictional resident ${resident.firstName} ${resident.lastName} (Room ${resident.room})`,
      }),
    },
  };
}

export function updateResident(state: DemoState, actorId: string, id: string, input: ResidentInput, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "edit residents");
  validateResident(input);
  const before = state.residents.find((r) => r.id === id);
  if (!before) throw new DemoRuleError("Resident not found.");
  const changed = (Object.keys(input) as (keyof ResidentInput)[]).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(input[k]));
  return {
    ...state,
    residents: state.residents.map((r) => (r.id === id ? { ...r, ...input } : r)),
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "resident.updated",
      entityType: "resident",
      entityId: id,
      summary: `Updated resident ${input.firstName} ${input.lastName}: ${changed.join(", ") || "no changes"}`,
      data: { changed: Object.fromEntries(changed.map((k) => [k, { from: before[k], to: input[k] }])) },
    }),
  };
}

export function setResidentActive(state: DemoState, actorId: string, id: string, active: boolean, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "change resident status");
  const r = state.residents.find((x) => x.id === id);
  if (!r) throw new DemoRuleError("Resident not found.");
  return {
    ...state,
    residents: state.residents.map((x) => (x.id === id ? { ...x, active } : x)),
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: active ? "resident.reactivated" : "resident.deactivated",
      entityType: "resident",
      entityId: id,
      summary: `${active ? "Reactivated" : "Deactivated (discharged)"} resident ${r.firstName} ${r.lastName}. History retained.`,
    }),
  };
}

export type StaffInput = Omit<Staff, "id" | "active">;

export function addStaff(state: DemoState, actorId: string, input: StaffInput, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "add staff accounts");
  if (!input.name.trim()) throw new DemoRuleError("Name is required.");
  const s: Staff = { ...input, id: newId("stf"), active: true, assignedResidentIds: input.role === "caregiver" ? input.assignedResidentIds : [] };
  return {
    ...state,
    staff: [...state.staff, s],
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "staff.created",
      entityType: "staff",
      entityId: s.id,
      summary: `Created simulated ${ROLE_LABEL[s.role]} account for ${s.name}`,
    }),
  };
}

export function updateStaff(state: DemoState, actorId: string, id: string, input: StaffInput, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "edit staff accounts");
  const before = state.staff.find((s) => s.id === id);
  if (!before) throw new DemoRuleError("Staff member not found.");
  if (!input.name.trim()) throw new DemoRuleError("Name is required.");
  if (id === staff.id && input.role !== "admin") throw new DemoRuleError("You cannot remove your own Administrator role.");
  return {
    ...state,
    staff: state.staff.map((s) => (s.id === id ? { ...s, ...input, assignedResidentIds: input.role === "caregiver" ? input.assignedResidentIds : [] } : s)),
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "staff.updated",
      entityType: "staff",
      entityId: id,
      summary: `Updated ${input.name}${before.role !== input.role ? ` (role ${ROLE_LABEL[before.role]} → ${ROLE_LABEL[input.role]})` : ""}`,
      data: { role: input.role, assignedResidentIds: input.assignedResidentIds },
    }),
  };
}

export function setStaffActive(state: DemoState, actorId: string, id: string, active: boolean, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "change account status");
  if (id === staff.id) throw new DemoRuleError("You cannot deactivate your own account.");
  const s = state.staff.find((x) => x.id === id);
  if (!s) throw new DemoRuleError("Staff member not found.");
  return {
    ...state,
    staff: state.staff.map((x) => (x.id === id ? { ...x, active } : x)),
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: active ? "staff.reactivated" : "staff.deactivated",
      entityType: "staff",
      entityId: id,
      summary: `${active ? "Reactivated" : "Deactivated"} account for ${s.name}`,
    }),
  };
}

export type OrderInput = Omit<MedicationOrder, "id" | "status" | "discontinuedAt" | "discontinuedReason">;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateOrder(input: Pick<OrderInput, "name" | "dose" | "route" | "times">) {
  if (!input.name.trim() || !input.dose.trim() || !input.route.trim()) throw new DemoRuleError("Medication name, dose and route are required.");
  if (input.times.length === 0) throw new DemoRuleError("Add at least one scheduled time.");
  if (input.times.some((t) => !TIME_RE.test(t))) throw new DemoRuleError("Times must be HH:MM (24-hour).");
  if (new Set(input.times).size !== input.times.length) throw new DemoRuleError("Scheduled times must be unique.");
}

export function addOrder(state: DemoState, actorId: string, input: OrderInput, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "enter medication schedules");
  validateOrder(input);
  const r = state.residents.find((x) => x.id === input.residentId);
  if (!r) throw new DemoRuleError("Choose a resident.");
  const order: MedicationOrder = { ...input, times: [...input.times].sort(), id: newId("ord"), status: "active" };
  return {
    ...state,
    orders: [...state.orders, order],
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "order.created",
      entityType: "order",
      entityId: order.id,
      summary: `Entered mock order ${order.name} ${order.strength} — ${order.dose} ${order.route} at ${order.times.join(", ")} for ${r.firstName} ${r.lastName}`,
      data: { ...input },
    }),
  };
}

export function changeOrderTimes(state: DemoState, actorId: string, orderId: string, times: string[], now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "change medication schedules");
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) throw new DemoRuleError("Order not found.");
  if (order.status !== "active") throw new DemoRuleError("Discontinued orders cannot be rescheduled.");
  validateOrder({ ...order, times });
  return {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, times: [...times].sort() } : o)),
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "order.schedule_changed",
      entityType: "order",
      entityId: orderId,
      summary: `Changed schedule for ${order.name}: ${order.times.join(", ")} → ${[...times].sort().join(", ")}`,
      data: { from: order.times, to: [...times].sort() },
    }),
  };
}

export function discontinueOrder(state: DemoState, actorId: string, orderId: string, reason: string, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "discontinue orders");
  if (!reason.trim()) throw new DemoRuleError("A discontinuation reason is required.");
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) throw new DemoRuleError("Order not found.");
  if (order.status === "discontinued") throw new DemoRuleError("Order is already discontinued.");
  return {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: "discontinued", discontinuedAt: now, discontinuedReason: reason.trim() } : o)),
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "order.discontinued",
      entityType: "order",
      entityId: orderId,
      summary: `Discontinued ${order.name} ${order.strength}. Reason: ${reason.trim()}`,
    }),
  };
}

export function updateSettings(state: DemoState, actorId: string, settings: Settings, now: number): DemoState {
  const staff = requireActor(state, actorId);
  requireRole(staff, ["admin"], "change facility settings");
  if (!settings.facilityName.trim()) throw new DemoRuleError("Facility name is required.");
  if (settings.documentationWindowMinutes < 15 || settings.documentationWindowMinutes > 240) throw new DemoRuleError("Window must be 15–240 minutes.");
  return {
    ...state,
    settings,
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: "settings.updated",
      entityType: "settings",
      entityId: "facility",
      summary: `Updated facility settings (${settings.facilityName}, ${settings.documentationWindowMinutes}-min documentation window)`,
      data: { ...settings },
    }),
  };
}

export function logReportGenerated(state: DemoState, actorId: string, report: string, now: number): DemoState {
  const staff = requireActor(state, actorId);
  return {
    ...state,
    audit: appendAudit(state.audit, {
      actor: actorOf(staff),
      at: now,
      action: report === "audit-export" ? "audit.exported" : "report.generated",
      entityType: report === "audit-export" ? "audit" : "report",
      entityId: report,
      summary: report === "audit-export" ? "Exported mock audit log" : `Printed/generated report: ${report}`,
    }),
  };
}
