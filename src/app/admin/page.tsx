"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, RotateCcw, UserX, UserCheck } from "lucide-react";
import { useDemo } from "@/lib/store";
import {
  addOrder,
  addResident,
  addStaff,
  changeOrderTimes,
  discontinueOrder,
  setResidentActive,
  setStaffActive,
  updateResident,
  updateSettings,
  updateStaff,
  type OrderInput,
  type ResidentInput,
  type StaffInput,
} from "@/lib/actions";
import { dateKey, fmtHHMM } from "@/lib/time";
import { ROLE_LABEL, type MedicationOrder, type Resident, type Role, type Staff } from "@/lib/types";
import { Avatar, Button, Card, ConfirmDialog, Dialog, ErrorNote, Field, PageHeader, Tabs, cx, inputCls } from "@/components/ui";
import { RequireRole } from "@/components/AppShell";

type Tab = "residents" | "staff" | "orders" | "facility";

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <Admin />
    </RequireRole>
  );
}

function Admin() {
  const [tab, setTab] = useState<Tab>("residents");
  return (
    <div>
      <PageHeader
        title="Facility administration"
        subtitle={
          <>
            Manage fictional residents, simulated staff accounts and mock medication schedules. New here? Try the{" "}
            <Link href="/onboarding" className="font-semibold text-brand-700 underline">
              onboarding walkthrough
            </Link>
            .
          </>
        }
      />
      <Tabs
        tabs={[
          { id: "residents", label: "Residents" },
          { id: "staff", label: "Staff & roles" },
          { id: "orders", label: "Medication schedules" },
          { id: "facility", label: "Facility & demo" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "residents" && <ResidentsAdmin />}
      {tab === "staff" && <StaffAdmin />}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "facility" && <FacilityAdmin />}
    </div>
  );
}

// ---------------------------------------------------------------- residents

const emptyResident = (today: string): ResidentInput => ({ firstName: "", lastName: "", preferredName: "", room: "", birthYear: 1940, allergies: [], physician: "", notes: "", admittedOn: today });

function ResidentsAdmin() {
  const { state, now, run } = useDemo();
  const [editing, setEditing] = useState<{ id?: string; data: ResidentInput } | null>(null);
  const [toggle, setToggle] = useState<Resident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const save = () => {
    if (!editing) return;
    const res = run((s, a, t) => (editing.id ? updateResident(s, a.id, editing.id, editing.data, t) : addResident(s, a.id, editing.data, t).state));
    setConfirm(false);
    if (res.ok) setEditing(null);
    else setError(res.error);
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button
          onClick={() => {
            setError(null);
            setEditing({ data: emptyResident(dateKey(now)) });
          }}
        >
          <Plus className="h-5 w-5" aria-hidden /> Add fictional resident
        </Button>
      </div>
      <Card className="divide-y divide-slate-200">
        {state.residents.map((r) => (
          <div key={r.id} className={cx("flex flex-wrap items-center gap-3 px-4 py-3", !r.active && "bg-slate-50 text-slate-500")}>
            <Avatar name={`${r.firstName} ${r.lastName}`} id={r.id} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="font-bold">
                {r.firstName} {r.lastName} {!r.active && "(inactive)"}
              </div>
              <div className="text-sm">
                Room {r.room} · Born {r.birthYear} · {state.orders.filter((o) => o.residentId === r.id && o.status === "active").length} active orders
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setError(null);
                const { id, active, ...data } = r;
                void active;
                setEditing({ id, data: { ...data } });
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden /> Edit
            </Button>
            <Button variant={r.active ? "ghost" : "secondary"} size="sm" onClick={() => setToggle(r)}>
              {r.active ? "Discharge" : "Reactivate"}
            </Button>
          </div>
        ))}
      </Card>

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit resident" : "Add fictional resident"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => setConfirm(true)}>Save resident</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-lg bg-amber-50 p-2 text-sm font-semibold text-amber-900 sm:col-span-2">Use fictional information only. Do not enter real patient data.</p>
            <Field label="First name" htmlFor="fn">
              <input id="fn" className={inputCls} value={editing.data.firstName} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, firstName: e.target.value } })} />
            </Field>
            <Field label="Last name" htmlFor="ln">
              <input id="ln" className={inputCls} value={editing.data.lastName} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, lastName: e.target.value } })} />
            </Field>
            <Field label="Preferred name" htmlFor="pn">
              <input id="pn" className={inputCls} value={editing.data.preferredName ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, preferredName: e.target.value } })} />
            </Field>
            <Field label="Room" htmlFor="rm">
              <input id="rm" className={inputCls} value={editing.data.room} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, room: e.target.value } })} />
            </Field>
            <Field label="Birth year" htmlFor="by">
              <input id="by" type="number" className={inputCls} value={editing.data.birthYear} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, birthYear: Number(e.target.value) } })} />
            </Field>
            <Field label="Physician (fictional)" htmlFor="ph">
              <input id="ph" className={inputCls} value={editing.data.physician} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, physician: e.target.value } })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Allergies" hint="Comma-separated" htmlFor="al">
                <input
                  id="al"
                  className={inputCls}
                  value={editing.data.allergies.join(", ")}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, allergies: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Care note" htmlFor="nt">
                <textarea id="nt" rows={2} className={inputCls} value={editing.data.notes ?? ""} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, notes: e.target.value } })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <ErrorNote error={error} />
            </div>
          </div>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirm}
        title="Confirm resident details"
        body={editing ? `Save ${editing.data.firstName} ${editing.data.lastName} (Room ${editing.data.room})? This is recorded in the audit trail.` : ""}
        confirmLabel="Confirm & save"
        onConfirm={save}
        onClose={() => setConfirm(false)}
      />
      <ConfirmDialog
        open={!!toggle}
        title={toggle?.active ? "Discharge resident?" : "Reactivate resident?"}
        body={toggle ? `${toggle.firstName} ${toggle.lastName} will be ${toggle.active ? "hidden from the med pass. All history is retained" : "returned to the med pass"}.` : ""}
        confirmLabel={toggle?.active ? "Discharge" : "Reactivate"}
        variant={toggle?.active ? "danger" : "primary"}
        onConfirm={() => {
          if (toggle) run((s, a, t) => setResidentActive(s, a.id, toggle.id, !toggle.active, t));
          setToggle(null);
        }}
        onClose={() => setToggle(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------- staff

function StaffAdmin() {
  const { state, user, run } = useDemo();
  const [editing, setEditing] = useState<{ id?: string; data: StaffInput } | null>(null);
  const [toggle, setToggle] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeResidents = state.residents.filter((r) => r.active);

  const save = () => {
    if (!editing) return;
    const res = run((s, a, t) => (editing.id ? updateStaff(s, a.id, editing.id, editing.data, t) : addStaff(s, a.id, editing.data, t)));
    if (res.ok) setEditing(null);
    else setError(res.error);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-600">Simulated accounts — no passwords. Roles control which screens and actions are available.</p>
        <Button
          onClick={() => {
            setError(null);
            setEditing({ data: { name: "", role: "caregiver", title: "Caregiver", assignedResidentIds: [] } });
          }}
        >
          <Plus className="h-5 w-5" aria-hidden /> Add staff account
        </Button>
      </div>
      <Card className="divide-y divide-slate-200">
        {state.staff.map((s) => (
          <div key={s.id} className={cx("flex flex-wrap items-center gap-3 px-4 py-3", !s.active && "bg-slate-50 text-slate-500")}>
            <Avatar name={s.name} id={s.id} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="font-bold">
                {s.name} {!s.active && "(deactivated)"}
              </div>
              <div className="text-sm">
                {ROLE_LABEL[s.role]} · {s.title}
                {s.role === "caregiver" && ` · ${s.assignedResidentIds.length} residents`}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setError(null);
                const { id, active, ...data } = s;
                void active;
                setEditing({ id, data });
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden /> Edit
            </Button>
            {s.id !== user?.id && (
              <Button variant="ghost" size="sm" onClick={() => setToggle(s)}>
                {s.active ? <UserX className="h-4 w-4" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
                {s.active ? "Deactivate" : "Reactivate"}
              </Button>
            )}
          </div>
        ))}
      </Card>
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit staff account" : "Add staff account"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save account</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <Field label="Name (fictional)" htmlFor="sn">
              <input id="sn" className={inputCls} value={editing.data.name} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })} />
            </Field>
            <Field label="Job title" htmlFor="st">
              <input id="st" className={inputCls} value={editing.data.title} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, title: e.target.value } })} />
            </Field>
            <Field label="Role" htmlFor="sr">
              <select id="sr" className={inputCls} value={editing.data.role} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, role: e.target.value as Role } })}>
                {(["caregiver", "supervisor", "admin"] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            {editing.data.role === "caregiver" && (
              <fieldset>
                <legend className="mb-1 font-semibold">Assigned residents</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeResidents.map((r) => {
                    const checked = editing.data.assignedResidentIds.includes(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-300 p-2">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-brand-700"
                          checked={checked}
                          onChange={() =>
                            setEditing({
                              ...editing,
                              data: {
                                ...editing.data,
                                assignedResidentIds: checked ? editing.data.assignedResidentIds.filter((x) => x !== r.id) : [...editing.data.assignedResidentIds, r.id],
                              },
                            })
                          }
                        />
                        Rm {r.room} — {r.firstName} {r.lastName}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <ErrorNote error={error} />
          </div>
        )}
      </Dialog>
      <ConfirmDialog
        open={!!toggle}
        title={toggle?.active ? "Deactivate account?" : "Reactivate account?"}
        body={toggle ? `${toggle.name} ${toggle.active ? "will no longer be able to sign in. Their past records remain attributed to them." : "will be able to sign in again."}` : ""}
        confirmLabel={toggle?.active ? "Deactivate" : "Reactivate"}
        variant={toggle?.active ? "danger" : "primary"}
        onConfirm={() => {
          if (toggle) run((s, a, t) => setStaffActive(s, a.id, toggle.id, !toggle.active, t));
          setToggle(null);
        }}
        onClose={() => setToggle(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------- orders

const TIME_CHOICES = ["06:00", "07:00", "08:00", "09:00", "12:00", "14:00", "17:00", "18:00", "20:00", "21:00", "22:00"];

function TimePicker({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_CHOICES.map((t) => {
        const on = value.includes(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t].sort())}
            className={cx("min-h-11 rounded-lg border-2 px-3 font-semibold", on ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white")}
          >
            {fmtHHMM(t)}
          </button>
        );
      })}
    </div>
  );
}

function OrdersAdmin() {
  const { state, now, run } = useDemo();
  const [residentId, setResidentId] = useState(state.residents.find((r) => r.active)?.id ?? "");
  const [adding, setAdding] = useState<OrderInput | null>(null);
  const [reschedule, setReschedule] = useState<{ order: MedicationOrder; times: string[] } | null>(null);
  const [dc, setDc] = useState<{ order: MedicationOrder; reason: string } | null>(null);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resident = state.residents.find((r) => r.id === residentId);
  const orders = state.orders.filter((o) => o.residentId === residentId).sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active"));

  return (
    <div>
      <Card className="mb-4 border-2 border-amber-400 bg-amber-50 p-4">
        <b>Mock medication schedules.</b> This screen demonstrates order setup with fictional data. In a real deployment, orders would come from a verified prescriber /
        pharmacy process — never typed in from memory, and never changed by AI. The AI assistant in this demo has no access to this screen or its functions.
      </Card>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Resident" htmlFor="ores">
          <select id="ores" className={inputCls} value={residentId} onChange={(e) => setResidentId(e.target.value)}>
            {state.residents
              .filter((r) => r.active)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room} — {r.firstName} {r.lastName}
                </option>
              ))}
          </select>
        </Field>
        <Button
          disabled={!resident}
          onClick={() => {
            setError(null);
            setAdding({ residentId, name: "", strength: "", form: "Tablet", dose: "1 tablet", route: "By mouth", times: [], instructions: "", indication: "", prescriber: resident?.physician ?? "", startDate: dateKey(now) });
          }}
        >
          <Plus className="h-5 w-5" aria-hidden /> Add mock order
        </Button>
      </div>
      <div className="space-y-2">
        {orders.map((o) => (
          <Card key={o.id} className={cx("flex flex-wrap items-center gap-3 p-3", o.status === "discontinued" && "border-dashed bg-slate-50 text-slate-500")}>
            <div className="min-w-0 flex-1">
              <div className={cx("text-lg font-bold", o.status === "discontinued" && "line-through")}>
                {o.name} {o.strength}
              </div>
              <div>
                {o.dose} · {o.route} · {o.times.map(fmtHHMM).join(", ")}
              </div>
              {o.status === "discontinued" && <div className="text-sm">Discontinued — {o.discontinuedReason}</div>}
            </div>
            {o.status === "active" ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setReschedule({ order: o, times: o.times })}>
                  Change times
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDc({ order: o, reason: "" })}>
                  Discontinue
                </Button>
              </>
            ) : (
              <span className="rounded-full bg-slate-300 px-2 text-sm font-bold text-slate-800">DISCONTINUED</span>
            )}
          </Card>
        ))}
      </div>

      <Dialog
        open={!!adding}
        onClose={() => setAdding(null)}
        title={`Add mock order — ${resident?.firstName ?? ""} ${resident?.lastName ?? ""}`}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(null)}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmAdd(true)} disabled={!adding?.name || adding.times.length === 0}>
              Review order
            </Button>
          </>
        }
      >
        {adding && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Medication name"],
                ["strength", "Strength"],
                ["form", "Form"],
                ["dose", "Dose (as written on order)"],
                ["route", "Route"],
                ["prescriber", "Prescriber (fictional)"],
                ["indication", "Indication"],
                ["instructions", "Administration instructions"],
              ] as const
            ).map(([k, label]) => (
              <Field key={k} label={label} htmlFor={`o-${k}`}>
                <input id={`o-${k}`} className={inputCls} value={adding[k]} onChange={(e) => setAdding({ ...adding, [k]: e.target.value })} />
              </Field>
            ))}
            <div className="sm:col-span-2">
              <Field label="Scheduled times">
                <TimePicker value={adding.times} onChange={(times) => setAdding({ ...adding, times })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <ErrorNote error={error} />
            </div>
          </div>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirmAdd}
        title="Confirm mock order"
        body={
          adding && (
            <div>
              <p className="text-lg font-bold">
                {adding.name} {adding.strength} — {adding.dose}, {adding.route}
              </p>
              <p>At {adding.times.map(fmtHHMM).join(", ")} starting today.</p>
              <p className="mt-2 text-sm">This fictional order will appear on the med pass and is recorded in the audit trail.</p>
            </div>
          )
        }
        confirmLabel="Confirm & add"
        onConfirm={() => {
          if (!adding) return;
          const res = run((s, a, t) => addOrder(s, a.id, adding, t));
          setConfirmAdd(false);
          if (res.ok) setAdding(null);
          else setError(res.error);
        }}
        onClose={() => setConfirmAdd(false)}
      />
      <Dialog
        open={!!reschedule}
        onClose={() => setReschedule(null)}
        title={`Change times — ${reschedule?.order.name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReschedule(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reschedule?.times.length}
              onClick={() => {
                if (!reschedule) return;
                const res = run((s, a, t) => changeOrderTimes(s, a.id, reschedule.order.id, reschedule.times, t));
                if (res.ok) setReschedule(null);
                else setError(res.error);
              }}
            >
              Confirm new schedule
            </Button>
          </>
        }
      >
        {reschedule && (
          <div className="space-y-3">
            <p>Current: {reschedule.order.times.map(fmtHHMM).join(", ")}</p>
            <TimePicker value={reschedule.times} onChange={(times) => setReschedule({ ...reschedule, times })} />
            <ErrorNote error={error} />
          </div>
        )}
      </Dialog>
      <Dialog
        open={!!dc}
        onClose={() => setDc(null)}
        title="Discontinue order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDc(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!dc?.reason.trim()}
              onClick={() => {
                if (!dc) return;
                const res = run((s, a, t) => discontinueOrder(s, a.id, dc.order.id, dc.reason, t));
                if (res.ok) setDc(null);
                else setError(res.error);
              }}
            >
              Confirm discontinue
            </Button>
          </>
        }
      >
        {dc && (
          <div className="space-y-3">
            <p>
              <b>
                {dc.order.name} {dc.order.strength}
              </b>{" "}
              will stop appearing on the med pass from now. Existing records are kept.
            </p>
            <Field label="Reason (required)" htmlFor="dcr">
              <input id="dcr" className={inputCls} value={dc.reason} onChange={(e) => setDc({ ...dc, reason: e.target.value })} placeholder="e.g. Discontinued by prescriber (fictional)" />
            </Field>
            <ErrorNote error={error} />
          </div>
        )}
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------- facility & demo

function FacilityAdmin() {
  const { state, run, reset } = useDemo();
  const [settings, setSettings] = useState(state.settings);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 text-xl font-bold">Facility settings</h2>
        <div className="space-y-3">
          <Field label="Facility name (fictional)" htmlFor="fname">
            <input id="fname" className={inputCls} value={settings.facilityName} onChange={(e) => setSettings({ ...settings, facilityName: e.target.value })} />
          </Field>
          <Field label="Documentation window (minutes)" hint="An undocumented dose becomes overdue this long after its scheduled time." htmlFor="win">
            <input
              id="win"
              type="number"
              min={15}
              max={240}
              className={inputCls}
              value={settings.documentationWindowMinutes}
              onChange={(e) => setSettings({ ...settings, documentationWindowMinutes: Number(e.target.value) })}
            />
          </Field>
          <Button
            onClick={() => {
              const res = run((s, a, t) => updateSettings(s, a.id, settings, t));
              setMsg(res.ok ? "Settings saved." : res.error);
            }}
          >
            Save settings
          </Button>
          {msg && <p role="status" className="font-semibold text-slate-700">{msg}</p>}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 text-xl font-bold">Demo data</h2>
        <p className="text-slate-700">
          All data is stored only in this browser. Resetting regenerates the fictional residents, orders and 3 days of simulated history anchored to the current time.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-5 w-5" aria-hidden /> Reset demo data
        </Button>
      </Card>
      <ConfirmDialog
        open={confirmReset}
        title="Reset all demo data?"
        body="This clears every record, audit event and change made in this browser and reloads fresh fictional data. You will be signed out."
        confirmLabel="Reset demo"
        variant="danger"
        onConfirm={() => {
          setConfirmReset(false);
          reset();
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
