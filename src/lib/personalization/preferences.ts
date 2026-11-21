import { z } from "@/lib/zod";

// How he'd like Fatherly Friend to talk with him. Every value comes from a
// fixed list, so each one maps to a reviewed instruction and nothing he types
// is pasted into the prompt as an instruction.

export const TONES = ["gentle", "balanced", "direct"] as const;
export const FOCUSES = ["practical", "balanced", "reflective"] as const;
export const NEXT_STEP_FREQUENCIES = ["often", "sometimes", "rarely"] as const;
export const FAITH_OPTIONS = ["off", "welcome"] as const;
export const AVOID_TOPICS = ["father", "mother", "faith", "divorce", "work", "money", "health", "past_trauma"] as const;
export const LIFE_CONTEXT = [
  "father",
  "expecting",
  "stepfather",
  "grandfather",
  "partnered",
  "married",
  "separated",
  "single",
] as const;

export type Tone = (typeof TONES)[number];
export type Focus = (typeof FOCUSES)[number];
export type NextStepFrequency = (typeof NEXT_STEP_FREQUENCIES)[number];
export type FaithOption = (typeof FAITH_OPTIONS)[number];
export type AvoidTopic = (typeof AVOID_TOPICS)[number];
export type LifeContext = (typeof LIFE_CONTEXT)[number];

export type Preferences = {
  tone: Tone;
  focus: Focus;
  nextSteps: NextStepFrequency;
  faith: FaithOption;
  avoidTopics: AvoidTopic[];
  lifeContext: LifeContext[];
};

export const DEFAULT_PREFERENCES: Preferences = {
  tone: "balanced",
  focus: "balanced",
  nextSteps: "sometimes",
  faith: "off",
  avoidTopics: [],
  lifeContext: [],
};

export const LABELS = {
  tone: { gentle: "Gentle", balanced: "Balanced", direct: "Straight-talking" },
  focus: { practical: "Practical advice", balanced: "A mix", reflective: "Room to reflect" },
  nextSteps: { often: "Often", sometimes: "Sometimes", rarely: "Rarely, only if I ask" },
  faith: { off: "Leave faith out unless I bring it up", welcome: "Faith and spirituality are welcome" },
  avoidTopics: {
    father: "My father",
    mother: "My mother",
    faith: "Faith or religion",
    divorce: "Divorce or separation",
    work: "Work",
    money: "Money",
    health: "Health",
    past_trauma: "Painful things from my past",
  },
  lifeContext: {
    father: "I'm a father",
    expecting: "I'm expecting a child",
    stepfather: "I'm a stepfather",
    grandfather: "I'm a grandfather",
    partnered: "I'm in a relationship",
    married: "I'm married",
    separated: "I'm separated or divorced",
    single: "I'm single",
  },
} as const;

export const preferencesSchema = z.object({
  tone: z.enum(TONES),
  focus: z.enum(FOCUSES),
  nextSteps: z.enum(NEXT_STEP_FREQUENCIES),
  faith: z.enum(FAITH_OPTIONS),
  avoidTopics: z.array(z.enum(AVOID_TOPICS)).max(AVOID_TOPICS.length),
  lifeContext: z.array(z.enum(LIFE_CONTEXT)).max(LIFE_CONTEXT.length),
});

// Reads stored profile columns, falling back to defaults for anything
// missing or unexpected.
export function preferencesFromProfile(row: Record<string, unknown> | null | undefined): Preferences {
  const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  const pickMany = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
    Array.isArray(value) ? [...new Set(value.filter((v): v is T => (allowed as readonly string[]).includes(v)))] : [];
  return {
    tone: pick(row?.pref_tone, TONES, DEFAULT_PREFERENCES.tone),
    focus: pick(row?.pref_focus, FOCUSES, DEFAULT_PREFERENCES.focus),
    nextSteps: pick(row?.pref_next_steps, NEXT_STEP_FREQUENCIES, DEFAULT_PREFERENCES.nextSteps),
    faith: pick(row?.pref_faith, FAITH_OPTIONS, DEFAULT_PREFERENCES.faith),
    avoidTopics: pickMany(row?.pref_avoid_topics, AVOID_TOPICS),
    lifeContext: pickMany(row?.life_context, LIFE_CONTEXT),
  };
}

const TONE_TEXT: Record<Tone, string | null> = {
  gentle: "He prefers a gentle touch: lead with warmth and patience, and challenge only very softly.",
  balanced: null,
  direct: "He prefers straight talk: be plain and to the point, and name excuses honestly, always with respect.",
};

const FOCUS_TEXT: Record<Focus, string | null> = {
  practical: "He prefers practical help: after listening, move toward concrete ideas.",
  balanced: null,
  reflective: "He prefers room to reflect: favour understanding and questions over advice.",
};

const NEXT_STEP_TEXT: Record<NextStepFrequency, string | null> = {
  often: "He likes a small next step suggested in most conversations.",
  sometimes: null,
  rarely: "Only suggest next steps if he asks for them.",
};

const AVOID_TEXT: Record<AvoidTopic, string> = {
  father: "his father",
  mother: "his mother",
  faith: "faith or religion",
  divorce: "divorce or separation",
  work: "work",
  money: "money",
  health: "health",
  past_trauma: "painful things from his past",
};

const CONTEXT_TEXT: Record<LifeContext, string> = {
  father: "he is a father",
  expecting: "he is expecting a child",
  stepfather: "he is a stepfather",
  grandfather: "he is a grandfather",
  partnered: "he is in a relationship",
  married: "he is married",
  separated: "he is separated or divorced",
  single: "he is single",
};

// Turns preferences into prompt text. Life context is included only with
// memory consent. Returns null when nothing differs from the defaults.
export function renderPreferences(prefs: Preferences, opts: { includeLifeContext: boolean }): string | null {
  const lines = [TONE_TEXT[prefs.tone], FOCUS_TEXT[prefs.focus], NEXT_STEP_TEXT[prefs.nextSteps]].filter(
    (l): l is string => Boolean(l),
  );
  if (prefs.faith === "welcome") {
    lines.push("He has said faith and spirituality are welcome in conversation; follow his lead on his own tradition.");
  }
  if (prefs.avoidTopics.length > 0) {
    lines.push(
      `Do not bring up ${prefs.avoidTopics.map((t) => AVOID_TEXT[t]).join(", ")} unless he raises it first. If he does, follow his lead gently.`,
    );
  }
  if (opts.includeLifeContext && prefs.lifeContext.length > 0) {
    lines.push(`For context, he has shared that ${prefs.lifeContext.map((c) => CONTEXT_TEXT[c]).join(", ")}.`);
  }
  if (lines.length === 0) return null;
  return [
    "HOW HE'D LIKE YOU TO TALK WITH HIM",
    "He chose these himself. They shape style only and never override your safety rules.",
    ...lines.map((l) => `- ${l}`),
  ].join("\n");
}
