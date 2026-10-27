// Monthly reflection: areas, labels, and when to offer one.

export const REFLECTION_AREAS = [
  { key: "confidence", label: "Confidence", question: "How steady do you feel in yourself?" },
  { key: "wellbeing", label: "Emotional well-being", question: "How have you been feeling, mostly?" },
  { key: "relationships", label: "Relationships", question: "How connected do you feel to the people who matter?" },
  { key: "identity", label: "Identity", question: "How clear are you on who you are and what you value?" },
  { key: "responsibility", label: "Personal responsibility", question: "How well have you been following through on what matters to you?" },
] as const;

export type ReflectionAreaKey = (typeof REFLECTION_AREAS)[number]["key"];

export const SCALE_LABELS: Record<number, string> = {
  1: "Struggling",
  2: "Shaky",
  3: "Getting by",
  4: "Fairly good",
  5: "Solid",
};

export const REFLECTION_INTERVAL_DAYS = 30;
export const SNOOZE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReflectionDueInput = {
  now: Date;
  promptsEnabled: boolean;
  snoozedUntil: string | null;
  onboardedAt: string | null;
  lastReflectionAt: string | null;
};

// A reflection is offered 30 days after onboarding or the last reflection,
// unless he has turned prompts off or snoozed them.
export function isReflectionDue(input: ReflectionDueInput): boolean {
  if (!input.promptsEnabled) return false;
  if (input.snoozedUntil && new Date(input.snoozedUntil) > input.now) return false;
  const anchor = input.lastReflectionAt ?? input.onboardedAt;
  if (!anchor) return false;
  return input.now.getTime() - new Date(anchor).getTime() >= REFLECTION_INTERVAL_DAYS * DAY_MS;
}

export function snoozeUntil(now: Date): Date {
  return new Date(now.getTime() + SNOOZE_DAYS * DAY_MS);
}
