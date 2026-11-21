import { describe, expect, it, vi } from "vitest";
import type { ChatProvider, GenerateRequest } from "@/lib/ai/types";
import { respond } from "@/lib/chat/respond";
import { KNOWLEDGE_ENTRIES, SOURCES_TO_VERIFY } from "./entries";
import { MAX_ENTRIES_PER_REPLY, renderKnowledge, selectKnowledge } from "./select";
import { isUsable, type KnowledgeEntry } from "./types";

const approved = (over: Partial<KnowledgeEntry> = {}): KnowledgeEntry => ({
  ...KNOWLEDGE_ENTRIES[0],
  review: { status: "approved", reviewer: "Dr. Reviewer", reviewedOn: "2026-12-01" },
  sources: KNOWLEDGE_ENTRIES[0].sources.map((s) => ({ ...s, verified: true })),
  ...over,
});

describe("knowledge entries", () => {
  it("are all still drafts: nothing reaches the AI before professional review", () => {
    expect(KNOWLEDGE_ENTRIES.filter(isUsable)).toEqual([]);
    expect(selectKnowledge(["I always push people away, my dad left"])).toEqual([]);
  });

  it("have unique ids, sources, keywords and caveats", () => {
    expect(new Set(KNOWLEDGE_ENTRIES.map((e) => e.id)).size).toBe(KNOWLEDGE_ENTRIES.length);
    for (const e of KNOWLEDGE_ENTRIES) {
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.keywords.length).toBeGreaterThan(0);
      expect(e.caveats.length).toBeGreaterThan(20);
      // Guidance is a short summary in our own words, not an excerpt.
      expect(e.guidance.length).toBeLessThan(900);
    }
  });

  it("labels the father-wound idea as theory, not a diagnosis", () => {
    const entry = KNOWLEDGE_ENTRIES.find((e) => e.id === "father-wound-theory")!;
    expect(entry.evidence).toBe("theoretical");
    expect(entry.guidance).toMatch(/not a clinical diagnosis/);
  });

  it("keeps the brief's unverified sources on the to-verify list", () => {
    const names = SOURCES_TO_VERIFY.map((s) => s.name).join(" ");
    expect(names).toContain("Sons of the Father");
    expect(names).toContain("The Fatherless Project");
  });
});

describe("isUsable", () => {
  it("needs approval, a named reviewer, a date and verified citations", () => {
    expect(isUsable(approved())).toBe(true);
    expect(isUsable(approved({ review: { status: "in_review", reviewer: "X", reviewedOn: "2026-12-01" } }))).toBe(false);
    expect(isUsable(approved({ review: { status: "approved", reviewer: " ", reviewedOn: "2026-12-01" } }))).toBe(false);
    expect(isUsable(approved({ review: { status: "approved", reviewer: "X", reviewedOn: null } }))).toBe(false);
    expect(isUsable(approved({ sources: [{ citation: "x", verified: false }] }))).toBe(false);
    expect(isUsable(approved({ sources: [] }))).toBe(false);
  });
});

describe("selectKnowledge", () => {
  const a = approved({ id: "a", keywords: ["lonely", "friends"] });
  const b = approved({ id: "b", keywords: ["angry"] });
  const c = approved({ id: "c", keywords: ["lonely"] });

  it("picks matching approved entries, best match first, at most two", () => {
    const picked = selectKnowledge(["I'm lonely and my friends drifted", "and I get angry"], [c, b, a]);
    expect(picked.map((e) => e.id)).toEqual(["a", "c"]);
    expect(picked.length).toBeLessThanOrEqual(MAX_ENTRIES_PER_REPLY);
  });

  it("returns nothing when nothing matches", () => {
    expect(selectKnowledge(["how do I fix a bike"], [a, b])).toEqual([]);
  });

  it("renders evidence strength honestly", () => {
    const text = renderKnowledge([approved({ evidence: "theoretical" })])!;
    expect(text).toContain("REVIEWED BACKGROUND");
    expect(text).toContain("not a research finding");
    expect(renderKnowledge([])).toBeNull();
  });
});

describe("knowledge in the chat pipeline", () => {
  it("adds approved, relevant guidance before the safety instructions", async () => {
    const calls: GenerateRequest[] = [];
    const provider: ChatProvider = { name: "fake", generate: vi.fn(async (r) => (calls.push(r), "ok")) };
    await respond([{ role: "user", content: "I feel hopeless and lonely" }], {
      provider,
      knowledgeEntries: [approved({ keywords: ["lonely"] })],
    });
    const system = calls[0].system;
    expect(system).toContain("REVIEWED BACKGROUND");
    expect(system.indexOf("REVIEWED BACKGROUND")).toBeLessThan(system.indexOf("SAFETY CONTEXT"));
  });
});
