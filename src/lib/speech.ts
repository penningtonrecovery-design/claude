// Spoken scripts for MARcheck's voice read-outs.
// These only read back what is already on the order and the record — they never
// add advice about whether to give, hold or change a medication.
import { OUTCOME_LABEL, type DoseView, type Outcome } from "./types";
import { fmtTime } from "./time";

const UNIT_WORDS: [RegExp, string][] = [
  [/(\d)\s*mcg\b/gi, "$1 micrograms"],
  [/(\d)\s*mg\b/gi, "$1 milligrams"],
  [/(\d)\s*g\b/gi, "$1 grams"],
  [/(\d)\s*ml\b/gi, "$1 milliliters"],
  [/(\d)\s*IU\b/g, "$1 international units"],
  [/(\d)\s*oz\b/gi, "$1 ounces"],
  [/(\d(?:\.\d+)?)\s*%/g, "$1 percent"],
  [/\s\/\s/g, " and "],
];

/** Make medication text easier to hear: expand units, drop symbols TTS reads badly. */
export function speakable(text: string): string {
  let t = text;
  for (const [re, rep] of UNIT_WORDS) t = t.replace(re, rep);
  return t.replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
}

function residentName(v: DoseView) {
  return `${v.resident.preferredName ? v.resident.preferredName + " " : v.resident.firstName + " "}${v.resident.lastName}`;
}

const STATUS_SPOKEN = {
  pending: "Pending",
  documented: "Already documented",
  overdue: "Overdue",
  exception: "Exception recorded",
} as const;

/** Read when a caregiver opens a dose. Allergies always come first. */
export function doseAnnouncement(v: DoseView): string {
  const parts: string[] = [];
  parts.push(v.resident.allergies.length ? `Allergy alert: ${v.resident.allergies.join(", ")}.` : "No known allergies recorded.");
  parts.push(`${residentName(v)}, room ${v.resident.room}.`);
  parts.push(`${v.order.name}, ${v.order.strength}.`);
  parts.push(`Dose on the order: ${v.order.dose}, ${v.order.route}.`);
  parts.push(`Scheduled ${fmtTime(v.scheduledAt)}. ${v.status === "pending" && v.dueNow ? "Due now" : STATUS_SPOKEN[v.status]}.`);
  if (v.order.instructions) parts.push(`Instructions: ${v.order.instructions}`);
  if (v.order.status === "discontinued") parts.push("Note: this order is discontinued.");
  return speakable(parts.join(" "));
}

/** Read on the confirmation step, before saving. */
export function confirmAnnouncement(v: DoseView, outcome: Outcome, reason?: string, correcting = false): string {
  const parts = [
    `Please confirm${correcting ? " this correction" : ""}.`,
    `${OUTCOME_LABEL[outcome]}.`,
    `${v.order.name}, ${v.order.strength}, ${v.order.dose}, for ${residentName(v)}, room ${v.resident.room}.`,
  ];
  if (outcome !== "administered" && reason) parts.push(`Reason: ${reason}.`);
  parts.push("Tick the confirmation box, then save.");
  return speakable(parts.join(" "));
}

/** Read after a record is saved. */
export function savedAnnouncement(v: DoseView, outcome: Outcome, staffName: string, correcting = false): string {
  return speakable(`${correcting ? "Correction saved" : "Saved"}. ${OUTCOME_LABEL[outcome]} recorded for ${residentName(v)}, ${v.order.name}, by ${staffName}.`);
}

/** Splits long text into sentence-sized chunks (some browsers cut off long utterances). */
export function chunkForSpeech(text: string, max = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && (cur + " " + s).length > max) {
      chunks.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) chunks.push(cur);
  return chunks;
}
