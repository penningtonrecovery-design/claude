// Starter steps for growth plans. Each step should be small, safe, and doable
// within about a week, without requiring confrontation or disclosure.
// This text needs professional review before public release.

export const TOPICS = [
  "confidence",
  "identity",
  "relationships",
  "emotional_regulation",
  "communication",
  "boundaries",
  "career",
  "financial_responsibility",
  "fatherhood",
  "personal_development",
] as const;

export type Topic = (typeof TOPICS)[number];

export type TopicInfo = {
  label: string;
  blurb: string;
  steps: string[];
};

export const LIBRARY: Record<Topic, TopicInfo> = {
  confidence: {
    label: "Confidence",
    blurb: "Trusting yourself, and acting before you feel ready.",
    steps: [
      "Each evening this week, write down one thing you handled well today, however small.",
      "Pick one small thing you've been putting off and do it before Friday.",
      "Next time you're about to apologise for something that isn't wrong, pause and say it without the 'sorry'.",
      "Stand or sit up straight and take three slow breaths before one conversation that makes you nervous.",
      "Say yes to one small invitation or opportunity you would usually turn down.",
    ],
  },
  identity: {
    label: "Identity",
    blurb: "Knowing what you value and who you want to be.",
    steps: [
      "Write down three men, real or fictional, you respect, and one quality each has that you want.",
      "List five values that matter to you. Circle the two that matter most.",
      "Notice one moment this week when you acted like the man you want to be. Write it down.",
      "Write one sentence finishing: 'I'm the kind of man who…'. Keep it somewhere you'll see it.",
      "Spend 20 minutes on something you enjoy just for its own sake, with no one else's approval involved.",
    ],
  },
  relationships: {
    label: "Relationships",
    blurb: "Building closer, steadier connections with the people in your life.",
    steps: [
      "Send a short message to one friend you haven't spoken to in a while. No agenda.",
      "In one conversation this week, ask a follow-up question instead of moving to your own story.",
      "Tell one person something specific you appreciate about them.",
      "Put your phone away for one full meal with someone you care about.",
      "Make a plan to see one friend in person in the next two weeks.",
    ],
  },
  emotional_regulation: {
    label: "Emotional regulation",
    blurb: "Feeling strong emotions without being run by them.",
    steps: [
      "Three times this week, stop and name what you're feeling in one word.",
      "When you notice anger rising, step away for ten slow breaths before you respond.",
      "Take a 15-minute walk on a day that feels heavy, and notice whether it shifts anything.",
      "Write for five minutes about something that's been bothering you. You don't have to keep it.",
      "Notice what your body does when you're stressed (jaw, shoulders, stomach) and loosen it once a day.",
    ],
  },
  communication: {
    label: "Communication",
    blurb: "Saying what you mean, and hearing others well.",
    steps: [
      "In one disagreement this week, repeat back what the other person said before giving your view.",
      "Use one 'I feel… when…' sentence instead of a 'you always…' sentence.",
      "Before an important conversation, write down the one thing you most want the other person to understand.",
      "Ask someone close to you, 'How are you, really?' and just listen to the answer.",
      "Notice one moment you went quiet when you had something to say. Write down what you'd have said.",
    ],
  },
  boundaries: {
    label: "Boundaries",
    blurb: "Protecting your time, energy and values without guilt.",
    steps: [
      "Notice one moment this week when you said yes but meant no. Just notice it.",
      "Practise saying 'Let me get back to you' instead of agreeing on the spot.",
      "Choose one evening this week that's protected time for rest or something you value.",
      "Write down one boundary you'd like to hold and how you'd say it in one calm sentence.",
      "Say no to one small request this week, kindly and without a long explanation.",
    ],
  },
  career: {
    label: "Career",
    blurb: "Work that fits who you are and where you want to go.",
    steps: [
      "Write down what you'd want your work to look like in three years, in five sentences or less.",
      "List three things you're good at at work, and one skill you'd like to build.",
      "Spend 30 minutes learning something related to that skill.",
      "Reach out to one person whose work you respect and ask one specific question.",
      "Update one section of your résumé or professional profile.",
    ],
  },
  financial_responsibility: {
    label: "Financial responsibility",
    blurb: "Getting steady with money, step by step.",
    steps: [
      "Write down what came in and what went out last week, roughly. No judgement, just a picture.",
      "Pick one regular expense you could pause or reduce, and decide whether you want to.",
      "Set up an automatic transfer of any amount, however small, into savings.",
      "Check one account or bill you've been avoiding looking at.",
      "Write down one money goal for the next six months.",
    ],
  },
  fatherhood: {
    label: "Fatherhood",
    blurb: "Being the kind of father you needed, or are learning to be.",
    steps: [
      "Spend 15 minutes with your child doing something they choose, with your phone away.",
      "Tell your child one specific thing you're proud of them for.",
      "Write down one thing your father did that you want to keep, and one you want to do differently.",
      "When you lose patience, try saying 'I'm frustrated, give me a minute' before you react.",
      "Ask your child one question about their world this week, and follow up on the answer later.",
    ],
  },
  personal_development: {
    label: "Personal development",
    blurb: "Habits, health and growth that build a steady life.",
    steps: [
      "Choose one small daily habit (a walk, ten pages, a glass of water first thing) and do it five days this week.",
      "Go to bed 20 minutes earlier on three nights this week.",
      "Read or listen to something for 15 minutes on a topic you want to understand better.",
      "Clear one cluttered space: a drawer, a desk, your car.",
      "At the end of the week, write down one thing you learned about yourself.",
    ],
  },
};

export const MAX_PLAN_STEPS = 5;
export const MIN_PLAN_STEPS = 1;
export const MAX_STEP_CHARS = 280;
export const MAX_FOCUS_CHARS = 300;

export function isTopic(value: unknown): value is Topic {
  return typeof value === "string" && (TOPICS as readonly string[]).includes(value);
}
