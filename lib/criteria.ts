export type CriterionKey =
  | "valueProp"
  | "mobileFriendly"
  | "loadSpeed"
  | "clickToCall"
  | "socialProof"
  | "primaryCta"
  | "contactFindability";

export type CriterionStatus = "good" | "needs_work" | "critical";

interface CriterionMeta {
  key: CriterionKey;
  label: string;
  description: string;
}

/**
 * Fixed display copy for the 7 scorecard rows, in report order.
 * The model only ever supplies `status` and `tip` for each key -
 * label/description live here so output stays deterministic and on-brand.
 */
export const CRITERIA: CriterionMeta[] = [
  {
    key: "valueProp",
    label: "Clear value prop above the fold",
    description: "Can a visitor tell what you do and why to pick you within 3 seconds?",
  },
  {
    key: "mobileFriendly",
    label: "Mobile-friendly",
    description: "Does the page declare a proper viewport and behave on a phone?",
  },
  {
    key: "loadSpeed",
    label: "Load speed",
    description: "Does the page load fast enough that visitors don't bounce?",
  },
  {
    key: "clickToCall",
    label: "Click-to-call on mobile",
    description: "Can a mobile visitor tap your phone number to call you directly?",
  },
  {
    key: "socialProof",
    label: "Reviews & social proof",
    description: "Are Google reviews, star ratings, or testimonials visible?",
  },
  {
    key: "primaryCta",
    label: "One clear primary CTA",
    description: "Is there a single obvious next step, or do links compete for attention?",
  },
  {
    key: "contactFindability",
    label: "Contact info findable in under 5 seconds",
    description: "Can a visitor find your phone, email, or address almost immediately?",
  },
];
