// Deterministic first-pass screen for risk in a user's message.
// It is intentionally conservative about explicit first-person risk and
// deliberately does not escalate common idioms ("this job is killing me").
// It is a floor, not a clinical assessment: it will miss indirect language,
// which is why the chat route also runs a moderation model when available.

export type SafetyLevel = "none" | "distress" | "abuse" | "crisis";

export type SafetyCategory =
  | "suicide"
  | "self_harm"
  | "harm_to_others"
  | "abuse"
  | "distress";

export type SafetyResult = {
  level: SafetyLevel;
  categories: SafetyCategory[];
};

const LEVEL_RANK: Record<SafetyLevel, number> = {
  none: 0,
  distress: 1,
  abuse: 2,
  crisis: 3,
};

type Rule = { level: SafetyLevel; category: SafetyCategory; pattern: RegExp };

const RULES: Rule[] = [
  // Explicit first-person suicidal intent or ideation.
  {
    level: "crisis",
    category: "suicide",
    pattern:
      /\b(kill(ing)? my ?self|end(ing)? (my|it all|my own) life|take (my|my own) life|end it all|commit(ting)? suicide|i('m| am) (feeling )?suicidal|suicidal thoughts|thinking (about|of) suicide)\b/,
  },
  {
    level: "crisis",
    category: "suicide",
    pattern:
      /\b(i (want|wanna|wish) (to |i could |i was |i were |i('d| would) )?(just |simply )?(die|be dead|not wake up|never wake up|disappear forever)|i don'?t want to (live|be alive|wake up)|(no|no point|no reason) (in )?(living|to live|to go on)|better off (dead|without me)|(i'?m|i am) going to end it|can'?t (go on|keep going) (living|anymore)|don'?t want to be here anymore)\b/,
  },
  // Self-harm.
  {
    level: "crisis",
    category: "self_harm",
    pattern:
      /\b((hurt|hurting|harm|harming|cut|cutting|burn|burning) my ?self|self[- ]?harm(ing)?|i('ll| will| might| am going to|'m going to| want to) overdose|i (overdosed|took too many pills))\b/,
  },
  // Intent to harm another person.
  {
    level: "crisis",
    category: "harm_to_others",
    pattern:
      /\b(i('m| am)? (going to|gonna|want to|wanna) (kill|hurt|shoot|stab) (him|her|them|someone|somebody|my (wife|girlfriend|boyfriend|husband|son|daughter|kid|kids|dad|father|mom|mother|boss)))\b/,
  },
  // Disclosures of current or past abuse.
  {
    level: "abuse",
    category: "abuse",
    pattern:
      /\b((he|she|they) (hits|beats|hurts|chokes|abuses) me|(being|was|got|been) (abused|molested|raped|sexually assaulted|beaten)|(abusing|abused|molested|raped) me|i('m| am) (afraid|scared) (of|for) my (safety|life)|(hurting|abusing|hitting) (my|the) (kid|kids|child|children|son|daughter))\b/,
  },
  // Distress worth slowing down for, without assuming risk.
  {
    level: "distress",
    category: "distress",
    pattern:
      /\b(hopeless|worthless|can'?t cope|can'?t take (it|this) anymore|falling apart|panic attacks?|breaking down|so alone|no one cares|nobody cares|suicide|overdos(e|ed)|self[- ]?destruct\w*|i hate myself|empty inside)\b/,
  },
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyMessage(text: string): SafetyResult {
  const normalized = normalize(text);
  let level: SafetyLevel = "none";
  const categories = new Set<SafetyCategory>();

  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      categories.add(rule.category);
      if (LEVEL_RANK[rule.level] > LEVEL_RANK[level]) level = rule.level;
    }
  }

  return { level, categories: [...categories] };
}

export function maxLevel(a: SafetyLevel, b: SafetyLevel): SafetyLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

export function mergeResults(a: SafetyResult, b: SafetyResult): SafetyResult {
  return {
    level: maxLevel(a.level, b.level),
    categories: [...new Set([...a.categories, ...b.categories])],
  };
}
