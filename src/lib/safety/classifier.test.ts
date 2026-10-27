import { describe, expect, it } from "vitest";
import { classifyMessage, classifySuggestion, maxLevel, mergeResults } from "./classifier";

describe("classifyMessage", () => {
  it.each([
    "I want to kill myself",
    "I've been thinking about ending my life",
    "honestly I think everyone would be better off without me",
    "I don't want to be alive anymore",
    "I’m going to end it tonight",
    "I keep cutting myself when it gets bad",
    "I took too many pills",
    "I'm going to overdose",
    "I'm feeling suicidal",
    "I wish I could just not wake up",
    "There's no reason to live",
  ])("flags crisis: %s", (text) => {
    expect(classifyMessage(text).level).toBe("crisis");
  });

  it("flags intent to harm another person as crisis", () => {
    const result = classifyMessage("I'm going to hurt him when he gets home");
    expect(result.level).toBe("crisis");
    expect(result.categories).toContain("harm_to_others");
  });

  it.each([
    "my stepdad beat me when I was a kid, I was abused for years",
    "she hits me when she's drunk",
    "I'm scared for my safety at home",
  ])("flags abuse disclosure: %s", (text) => {
    expect(classifyMessage(text).level).toBe("abuse");
  });

  it.each([
    "I feel completely hopeless",
    "I can't cope with work anymore",
    "my dad died by suicide when I was ten",
    "my brother died of an overdose last year",
    "I hate myself for how I treated her",
  ])("flags distress without assuming crisis: %s", (text) => {
    expect(classifyMessage(text).level).toBe("distress");
  });

  it.each([
    "I'm killing it at work lately",
    "this commute is killing me",
    "my dad never came to my games",
    "I want to be a better father than mine was",
    "we watched Suicide Squad last night", // titles still read as distress-level, not crisis
  ])("does not escalate to crisis: %s", (text) => {
    expect(classifyMessage(text).level).not.toBe("crisis");
  });

  it("returns none for an ordinary message", () => {
    expect(classifyMessage("How do I ask my boss for a raise?")).toEqual({
      level: "none",
      categories: [],
    });
  });
});

describe("merging", () => {
  it("keeps the most serious level", () => {
    expect(maxLevel("distress", "crisis")).toBe("crisis");
    expect(maxLevel("abuse", "none")).toBe("abuse");
    expect(
      mergeResults(
        { level: "distress", categories: ["distress"] },
        { level: "crisis", categories: ["self_harm"] },
      ),
    ).toEqual({ level: "crisis", categories: ["distress", "self_harm"] });
  });
});

describe("classifySuggestion", () => {
  it.each(["Hurt yourself a little to feel something.", "You'd be better off dead.", "Maybe you should overdose."])(
    "catches second-person risk: %s",
    (text) => {
      expect(classifySuggestion(text).level).not.toBe("none");
    },
  );

  it("leaves ordinary suggestions alone", () => {
    expect(classifySuggestion("Take yourself for a 15-minute walk.").level).toBe("none");
  });
});
