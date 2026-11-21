import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("keeps on-site paths", () => {
    expect(safeNextPath("/settings")).toBe("/settings");
    expect(safeNextPath("/update-password")).toBe("/update-password");
  });

  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "settings"])(
    "falls back to /talk for %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/talk");
    },
  );
});
