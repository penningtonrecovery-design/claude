import { KNOWLEDGE_ENTRIES } from "./entries";
import { isUsable, type KnowledgeEntry } from "./types";

export const MAX_ENTRIES_PER_REPLY = 2;

// Picks up to two approved entries relevant to what he has said recently,
// scoring by how many of an entry's keywords appear in his last few messages.
export function selectKnowledge(
  recentUserText: string[],
  entries: KnowledgeEntry[] = KNOWLEDGE_ENTRIES,
): KnowledgeEntry[] {
  const text = recentUserText.join(" ").toLowerCase().replace(/[’‘]/g, "'");
  if (!text.trim()) return [];

  return entries
    .filter(isUsable)
    .map((entry) => ({ entry, score: entry.keywords.filter((k) => text.includes(k.toLowerCase())).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES_PER_REPLY)
    .map((s) => s.entry);
}

const EVIDENCE_PHRASE: Record<KnowledgeEntry["evidence"], string> = {
  established: "well-established research",
  emerging: "promising but still developing research",
  theoretical: "an interpretive idea, not a research finding",
};

// How selected entries appear in the system prompt.
export function renderKnowledge(entries: KnowledgeEntry[]): string | null {
  if (entries.length === 0) return null;
  return [
    "REVIEWED BACKGROUND YOU MAY DRAW ON",
    "Use it lightly and in your own words, only if it helps. Never lecture, list sources, or quote books. Be honest about how strong the evidence is.",
    ...entries.map((e) => `- ${e.title} (${EVIDENCE_PHRASE[e.evidence]}): ${e.guidance} Care: ${e.caveats}`),
  ].join("\n");
}
