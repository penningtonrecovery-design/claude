// In-app check-ins: a fixed, reviewable library of short notes, and the
// rules for when one appears. Notes must never guilt, pressure, count
// absences, or suggest he depends on the app. Tests enforce this.
// The wording needs professional review before public release.

export const CHECKIN_FREQUENCIES = ["off", "weekly", "biweekly", "monthly"] as const;
export type CheckinFrequency = (typeof CHECKIN_FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<CheckinFrequency, string> = {
  off: "Off",
  weekly: "About once a week",
  biweekly: "About every two weeks",
  monthly: "About once a month",
};

const INTERVAL_DAYS: Record<Exclude<CheckinFrequency, "off">, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export type CheckinNote = { key: string; text: string };

// General notes, used when memory is off or there are no open steps.
export const GENERAL_NOTES: CheckinNote[] = [
  { key: "g-how-are-you", text: "Good to see you. How are you doing, really?" },
  { key: "g-on-your-mind", text: "Whatever's on your mind today, big or small, I'm glad to hear it." },
  { key: "g-week", text: "How has this week treated you so far?" },
  { key: "g-small-win", text: "Any small win lately? They count more than people think." },
  { key: "g-weight", text: "If something's been weighing on you, we can set it down here for a bit." },
  { key: "g-proud", text: "What's one thing you handled well recently? Take a second to notice it." },
  { key: "g-people", text: "Who's been on your mind lately? Sometimes the people around us tell us a lot about where we are." },
  { key: "g-rest", text: "Have you had a moment to rest lately? Rest is part of the work, not a break from it." },
  { key: "g-steady", text: "What's helped you feel steady lately, even a little?" },
  { key: "g-no-agenda", text: "No agenda today. Just here if you want to talk." },
  { key: "g-learning", text: "Learned anything about yourself lately? Even a small thing." },
  { key: "g-hard-thing", text: "Is there a conversation you've been turning over in your head? We could think it through together." },
];

// Notes that name one of his own open steps. Only used with memory on.
// {step} is replaced with the step's text.
export const STEP_NOTES: CheckinNote[] = [
  { key: "s-how-going", text: "I was thinking about your step: \"{step}\". How's it going? No wrong answer." },
  { key: "s-noticed", text: "Your step \"{step}\" — anything you noticed while trying it, or while not getting to it?" },
  { key: "s-still-fits", text: "Does \"{step}\" still feel like the right step? It's fine to change it." },
  { key: "s-smaller", text: "If \"{step}\" feels like too much right now, we could find a smaller version together." },
  { key: "s-what-helped", text: "Whatever happened with \"{step}\", I'd like to hear about it. What helped, or what got in the way?" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STEP_IN_NOTE = 100;

export function isCheckinFrequency(value: unknown): value is CheckinFrequency {
  return typeof value === "string" && (CHECKIN_FREQUENCIES as readonly string[]).includes(value);
}

export type CheckinDueInput = {
  now: Date;
  frequency: CheckinFrequency;
  enabledAt: string | null;
  lastCheckinAt: string | null;
};

// Due one full interval after he turned check-ins on, then one interval
// after he last answered or dismissed one.
export function isCheckinDue({ now, frequency, enabledAt, lastCheckinAt }: CheckinDueInput): boolean {
  if (frequency === "off") return false;
  const anchor = lastCheckinAt ?? enabledAt;
  if (!anchor) return false;
  return now.getTime() - new Date(anchor).getTime() >= INTERVAL_DAYS[frequency] * DAY_MS;
}

function shorten(step: string): string {
  const clean = step.trim().replace(/[.\s]+$/, "");
  return clean.length <= MAX_STEP_IN_NOTE ? clean : `${clean.slice(0, MAX_STEP_IN_NOTE - 1).trimEnd()}…`;
}

export type PickInput = {
  now: Date;
  lastKey: string | null;
  // Open steps from his active plans; pass [] when memory is off.
  openSteps: string[];
};

// Deterministic for a given day, so the note doesn't change on refresh, and
// never repeats the last note he saw.
export function pickCheckin({ now, lastKey, openSteps }: PickInput): CheckinNote {
  const day = Math.floor(now.getTime() / DAY_MS);
  const useStep = openSteps.length > 0 && day % 2 === 0;
  const pool = (useStep ? STEP_NOTES : GENERAL_NOTES).filter((n) => n.key !== lastKey);
  const note = pool[day % pool.length];
  if (!useStep) return note;
  const step = openSteps[day % openSteps.length];
  return { key: note.key, text: note.text.replace("{step}", shorten(step)) };
}
