// The research-informed guidance library. Every entry is written in our own
// words (never quoted from a book) and states how strong the evidence is.
// Only entries that pass isUsable() are ever shown to the language model.

export type EvidenceLevel =
  // Consistent findings across multiple well-designed studies or meta-analyses.
  | "established"
  // Promising but limited, mixed, or mostly from one research group or method.
  | "emerging"
  // A framework or interpretation (for example Jungian or psychoanalytic),
  // useful for reflection but not an empirical finding.
  | "theoretical";

export type ReviewStatus = "draft" | "in_review" | "approved" | "retired";

export type Source = {
  citation: string;
  // Set to true only after someone has checked the citation against the
  // original (author, title, year, publisher or journal).
  verified: boolean;
};

export type KnowledgeEntry = {
  id: string;
  title: string;
  // Words in a user's message that make this entry relevant.
  keywords: string[];
  evidence: EvidenceLevel;
  // What the model may draw on, in plain language, written for this app.
  guidance: string;
  // How the model should use it, and what it must not claim.
  caveats: string;
  sources: Source[];
  review: {
    status: ReviewStatus;
    reviewer: string | null;
    reviewedOn: string | null;
    notes?: string;
  };
};

// An entry reaches the model only when a named reviewer has approved it and
// every one of its citations has been verified.
export function isUsable(entry: KnowledgeEntry): boolean {
  return (
    entry.review.status === "approved" &&
    Boolean(entry.review.reviewer?.trim()) &&
    Boolean(entry.review.reviewedOn) &&
    entry.sources.length > 0 &&
    entry.sources.every((s) => s.verified)
  );
}
