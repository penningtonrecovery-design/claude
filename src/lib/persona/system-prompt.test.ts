import { describe, expect, it } from "vitest";
import { buildSystemPrompt, FATHERLY_FRIEND_PROMPT } from "./system-prompt";

// Guards the non-negotiable parts of the persona against accidental edits.
describe("Fatherly Friend persona", () => {
  it.each([
    ["discloses being an AI", /You are an AI/],
    ["refuses to impersonate real people or relatives", /never claim to be a human, a real person, a deceased relative/],
    ["is not a therapist and does not diagnose", /not a therapist[\s\S]*do not diagnose/],
    ["asks one question at a time", /one thoughtful question at a time/i],
    ["never shames", /Never shame/],
    ["does not press for painful memories", /Do not press for painful memories/],
    ["does not treat father wound as a diagnosis", /"father wound"[\s\S]*diagnosis/],
    ["does not blame everything on the father", /Do not attribute all of his difficulties/],
    ["discourages dependency", /Do not encourage him to rely on you/],
    ["points to 988 in a crisis", /988/],
    ["avoids reproducing copyrighted books", /copyrighted/],
  ])("%s", (_label, pattern) => {
    expect(FATHERLY_FRIEND_PROMPT).toMatch(pattern);
  });

  it("is unchanged when no context is given", () => {
    expect(buildSystemPrompt()).toBe(FATHERLY_FRIEND_PROMPT);
  });

  it("omits the memory section when memories are empty", () => {
    expect(buildSystemPrompt({ memories: [] })).not.toContain("ASKED YOU TO REMEMBER");
  });
});
