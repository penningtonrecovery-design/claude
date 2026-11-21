// Deterministic first-pass screen for risk in a user's message.
// It is intentionally conservative about first-person risk, including common
// indirect and slang phrasings, and deliberately does not escalate idioms
// ("this job is killing me"). It is a floor, not a clinical assessment: it
// will still miss language it has not seen, which is why the chat route also
// runs a moderation model when available. Measured against
// src/lib/safety/eval/cases.ts; see docs/safety/SCORECARD.md.

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

type Rule = {
  level: SafetyLevel;
  category: SafetyCategory;
  pattern: RegExp;
  // When this also matches, the rule applies at `downgradeTo` instead
  // (for example a clearly past-tense mention).
  unless?: RegExp;
  downgradeTo?: SafetyLevel;
};

// Builds a whole-word pattern from a list of phrases, so each phrase can be
// read (and reviewed) on its own line.
const anyOf = (phrases: string[]) => new RegExp(`\\b(?:${phrases.join("|")})\\b`);

// Optional softeners people put before a verb: "I just want to…".
const SOFT = "(?:just |really |honestly |seriously |kinda |kind of )?";

// Words that make a self-harm mention clearly historical, unless something
// says it is happening again.
const PAST_ONLY = /\b(?:used to|years ago|as a (?:kid|teen|teenager|boy)|in (?:high )?school|back then)\b/;
const HAPPENING_NOW = /\b(?:again|still|started|lately|recently|tonight|today|right now)\b/;

const RULES: Rule[] = [
  // Explicit first-person suicidal intent or ideation.
  {
    level: "crisis",
    category: "suicide",
    pattern: anyOf([
      "kill(?:ing)? my ?self(?! laughing)",
      "hang(?:ing)? my ?self",
      "end(?:ing)? (?:my|my own) life",
      "take (?:my|my own) life",
      "end it all",
      "commit(?:ting)? suicide",
      "i(?:'m| am) (?:feeling )?suicidal",
      "suicidal thoughts",
      "thinking (?:about|of) suicide",
      `i ${SOFT}(?:want|wanna|wish)(?: to| i could| i was| i were| i'd| i would)? ${SOFT}(?:die|be dead|dead|not wake up|never wake up|disappear forever)`,
      "i(?:'m| am) ready to die",
      `i ${SOFT}don'?t want to (?:live|be alive|wake up|exist)`,
      "(?:no|no point|no reason) (?:in )?(?:living|to live|to go on|being alive)",
      "what'?s the point (?:of|in) (?:going on|living|being alive|staying alive)",
      "better off (?:dead|without me|if i (?:was|were) gone|with me gone)",
      "(?:nobody|no one) (?:would|will) (?:even )?miss me",
      "(?:nobody|no one) (?:would|will) (?:even )?care if i (?:died|was dead|were dead|was gone|were gone|killed myself)",
      "(?:better|happier) (?:off )?if i (?:wasn'?t|weren'?t|was not|were not) (?:around|here|alive)",
      "(?:go to |)sleep forever",
      "cease to exist",
      "pain to (?:end|stop) (?:for good|forever|permanently)",
      "can'?t (?:go on|keep going) (?:living|anymore|like this)",
      "don'?t want to be here anymore",
      "tired of (?:being alive|living|existing)",
      // "end it" / "end things" — but not "end it with her", "end things with my girlfriend".
      "(?:i(?:'m| am)? )?(?:going to|gonna|ready to|want to|wanna|might(?: just)?|will|about to) end (?:it|things|everything)(?! with| between)",
      "(?:tonight'?s|today'?s) the (?:night|day) i end (?:it|things)",
      "(?:way out|escape) (?:except|but|other than) (?:ending|killing|dying)",
      "(?:want|wish) (?:it|everything) (?:all )?to stop[.,!]* (?:permanently|for good|forever)",
      "(?:looking up|researching|googling|searching) (?:ways|how) to (?:die|kill myself|end it)",
      "(?:got|have|saved|saving|stockpil\\w*|stashed) (?:up )?(?:the |my |some )?pills(?: saved| ready| stashed)?(?= *(?:saved|up|ready|stashed|$|\\.))",
      "how i'?d do it(?! differently| better| again| over)",
      "how i would do it(?! differently| better| again| over)",
      "giving (?:my (?:things|stuff|belongings) away|away my (?:things|stuff|belongings))(?! to charity)",
      "(?:goodbye|suicide) (?:note|letter)s?",
      "letters? to my \\w+,? just in case",
      "(?:garage|car) with the engine running",
      "(?:i'?d )?rather be dead",
      "(?:sleep|go to sleep) and (?:never|not) wake up",
      "hope i (?:don'?t|never) wake up",
      "life (?:isn'?t|is not|ain'?t) worth (?:living|it)",
      "(?:want|wish) (?:my life|it all|everything|this life) (?:to be|was|were) over",
      "(?:fantasiz|dream|think)\\w* (?:about|of) (?:not existing|dying|being dead|my death|killing myself)",
      "think(?:ing)? about (?:dying|death|ending it|ending things|ending my life) (?:every|all the|a lot|constantly)",
      "thinking about (?:ending it|ending things|ending my life|dying)",
      "(?:won'?t|will not) be (?:here|around) (?:much longer|for long|for much longer|anymore)",
      "(?:don'?t think i'?ll|not going to) be (?:here|around) (?:much longer|for long|anymore)",
      "(?:made my peace|said my goodbyes|saying my goodbyes)",
      "(?:drive|crash|steer) (?:my car|my truck|the car) (?:into|off)",
      "jump(?:ing)? (?:off|from) (?:the|a|my) (?:bridge|roof|building|ledge|balcony|cliff)",
      "(?:bridge|roof|ledge|balcony)\\b.{0,40}\\b(?:jump|jumping)",
      "bullet (?:in|through) my (?:head|brain|skull)",
      "(?:gun|rifle|pistol|rope|pills)\\b.{0,40}\\bkeep (?:looking at|staring at|thinking about) (?:it|them)",
      "take (?:all|every one) (?:of )?my (?:meds|pills|medication|prescriptions?)",
      // Slang.
      "kms",
      "unaliv(?:e|ing) (?:my ?self|me)",
    ]),
  },
  // Self-harm. A clearly past-tense mention ("used to self-harm as a
  // teenager") gets a gentle response, not the crisis one.
  {
    level: "crisis",
    category: "self_harm",
    pattern: anyOf([
      "(?:hurt|hurting|harm|harming|cut|cutting|burn|burning) my ?self",
      "self[- ]?harm(?:ing)?",
      "i(?:'ll| will| might| am going to|'m going to| want to) overdose",
      "i (?:overdosed|took too many pills)",
      "overdos(?:e|ing) on (?:my|the|his|her)? ?\\w+",
      "want(?:ed)? it to hurt",
    ]),
    unless: PAST_ONLY,
    downgradeTo: "distress",
  },
  // Intent to harm another person.
  {
    level: "crisis",
    category: "harm_to_others",
    pattern: anyOf([
      "i(?:'m| am)? (?:going to|gonna|want to|wanna) (?:kill|hurt|shoot|stab) (?:him|her|them|someone|somebody|my (?:wife|girlfriend|boyfriend|husband|son|daughter|kid|kids|dad|father|mom|mother|boss|brother|neighbor))",
    ]),
  },
  // Disclosures of current or past abuse.
  {
    level: "abuse",
    category: "abuse",
    pattern: anyOf([
      "(?:he|she|they|dad|father|stepfather|stepdad|step-dad|mom|mother|stepmother|stepmom|uncle|aunt|brother|sister|grandfather|grandpa|coach|teacher|priest|partner|wife|husband|girlfriend|boyfriend|ex) (?:hits|hit|beats|beat|hurts|chokes|choked|abuses|abused|molested|raped|assaulted) me(?! up| with)",
      "(?:being|was|got|been) (?:sexually )?(?:abused|molested|raped|assaulted|beaten(?: up)?)",
      "(?:abusing|abused|molested|raped) me",
      "i(?:'m| am) (?:afraid|scared) (?:of|for) my (?:safety|life)",
      "(?:hurting|abusing|hitting) (?:my|the) (?:kid|kids|child|children|son|daughter)",
    ]),
  },
  // Distress worth slowing down for, without assuming risk.
  {
    level: "distress",
    category: "distress",
    pattern: anyOf([
      "hopeless",
      "worthless",
      "can'?t cope",
      "can'?t take (?:it|this) anymore",
      "falling apart",
      "panic attacks?",
      "breaking down",
      "so alone",
      "(?:no one|nobody) cares",
      "suicid\\w*",
      "overdos(?:e|ed)",
      "self[- ]?destruct\\w*",
      "i hate myself",
      "empty inside",
      "drowning",
      "(?:such a|a total|a complete|a) failure",
      "barely holding on",
      "can'?t get out of bed",
      "numb (?:all the time|inside)",
      "i(?:'m| am| feel) numb",
      "(?:want|wish) (?:it|everything) (?:all )?to stop",
      "(?:i'?m|i am|i feel like|feel like) (?:a|such a|just a) burden(?! on my wallet)",
      "can'?t do this anymore",
    ]),
  },
];

// Names and terms that contain alarming words but carry no risk.
const HARMLESS_TERMS = /\bsuicide (?:squad|drills?|runs?|sprints?|doors?|lane|knot|blonde)\b|\bkilling (?:my ?self|me) laughing\b/g;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\babt\b/g, "about")
    .replace(/\bim\b/g, "i'm")
    .replace(/\bdont\b/g, "don't")
    .replace(/\bcant\b/g, "can't")
    .replace(/\bwont\b/g, "won't")
    .replace(/\bu\b/g, "you")
    .trim();
}

export function classifyMessage(text: string): SafetyResult {
  const normalized = normalize(text).replace(HARMLESS_TERMS, " ");
  let level: SafetyLevel = "none";
  const categories = new Set<SafetyCategory>();

  for (const rule of RULES) {
    if (!rule.pattern.test(normalized)) continue;
    const downgraded =
      rule.unless && rule.downgradeTo && rule.unless.test(normalized) && !HAPPENING_NOW.test(normalized);
    const ruleLevel = downgraded ? rule.downgradeTo! : rule.level;
    categories.add(downgraded ? "distress" : rule.category);
    if (LEVEL_RANK[ruleLevel] > LEVEL_RANK[level]) level = ruleLevel;
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

// Screens text addressed to him ("you", "yourself"), such as AI-suggested
// steps, by also reading it in the first person.
export function classifySuggestion(text: string): SafetyResult {
  const firstPerson = normalize(text)
    .replace(/\byourself\b/g, "myself")
    .replace(/\byou('re| are)\b/g, "i'm")
    .replace(/\byour\b/g, "my")
    .replace(/\byou\b/g, "i");
  return mergeResults(classifyMessage(text), classifyMessage(firstPerson));
}
