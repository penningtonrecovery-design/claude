// Core domain types for the Marcheck demo.
// All data is fictional. Timestamps are epoch milliseconds (local time zone).

export type Role = "caregiver" | "supervisor" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  caregiver: "Caregiver",
  supervisor: "Supervisor",
  admin: "Administrator",
};

export interface Staff {
  id: string;
  name: string;
  role: Role;
  title: string;
  active: boolean;
  /** Residents this staff member is assigned to (caregivers only). */
  assignedResidentIds: string[];
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  room: string;
  birthYear: number;
  allergies: string[];
  physician: string;
  notes?: string;
  active: boolean;
  admittedOn: string; // YYYY-MM-DD
}

export type OrderStatus = "active" | "discontinued";

export interface MedicationOrder {
  id: string;
  residentId: string;
  name: string;
  strength: string;
  form: string;
  dose: string;
  route: string;
  /** Scheduled times of day, "HH:MM" 24h. */
  times: string[];
  instructions: string;
  indication: string;
  prescriber: string;
  startDate: string; // YYYY-MM-DD
  status: OrderStatus;
  discontinuedAt?: number;
  discontinuedReason?: string;
}

export type Outcome = "administered" | "refused" | "held" | "not_administered";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  administered: "Administered",
  refused: "Refused",
  held: "Held",
  not_administered: "Not administered",
};

export interface AdministrationRecord {
  id: string;
  doseId: string;
  orderId: string;
  residentId: string;
  scheduledAt: number;
  outcome: Outcome;
  reason?: string;
  note?: string;
  staffId: string;
  recordedAt: number;
  /** If set, this record is a correction that replaces the referenced record. */
  supersedesId?: string;
  correctionReason?: string;
}

export type ReviewAction = "acknowledged" | "escalated";

export interface ReviewRecord {
  id: string;
  doseId: string;
  reviewerId: string;
  at: number;
  action: ReviewAction;
  note: string;
  escalatedTo?: string;
}

export interface DemoNotification {
  id: string;
  createdAt: number;
  /** Recipient role, or a specific staff id. */
  toRole?: Role;
  toStaffId?: string;
  title: string;
  body: string;
  doseId?: string;
  kind: "exception" | "reminder" | "escalation" | "info";
  readBy: string[];
}

export type AuditAction =
  | "demo.seeded"
  | "session.login"
  | "session.logout"
  | "dose.documented"
  | "record.corrected"
  | "review.acknowledged"
  | "review.escalated"
  | "reminder.sent"
  | "resident.created"
  | "resident.updated"
  | "resident.deactivated"
  | "resident.reactivated"
  | "staff.created"
  | "staff.updated"
  | "staff.deactivated"
  | "staff.reactivated"
  | "order.created"
  | "order.schedule_changed"
  | "order.discontinued"
  | "settings.updated"
  | "report.generated"
  | "audit.exported";

export interface AuditEvent {
  seq: number;
  id: string;
  at: number;
  actorId: string;
  actorName: string;
  actorRole: Role | "system";
  action: AuditAction;
  entityType: "dose" | "record" | "resident" | "staff" | "order" | "settings" | "session" | "report" | "audit" | "system";
  entityId: string;
  summary: string;
  data?: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface Settings {
  facilityName: string;
  /** Minutes after the scheduled time before an undocumented dose is overdue. */
  documentationWindowMinutes: number;
}

export interface DemoState {
  version: number;
  seededAt: number;
  settings: Settings;
  staff: Staff[];
  residents: Resident[];
  orders: MedicationOrder[];
  records: AdministrationRecord[];
  reviews: ReviewRecord[];
  notifications: DemoNotification[];
  audit: AuditEvent[];
  sessionStaffId: string | null;
}

export type DoseStatus = "pending" | "documented" | "overdue" | "exception";

export interface ScheduledDose {
  id: string;
  orderId: string;
  residentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  scheduledAt: number;
}

export interface DoseView extends ScheduledDose {
  status: DoseStatus;
  /** True when pending and within the administration window (or past scheduled time). */
  dueNow: boolean;
  order: MedicationOrder;
  resident: Resident;
  /** Current (non-superseded) record, if any. */
  record?: AdministrationRecord;
  /** All records for this dose, oldest first, including superseded ones. */
  history: AdministrationRecord[];
  reviews: ReviewRecord[];
}

export class DemoRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoRuleError";
  }
}
