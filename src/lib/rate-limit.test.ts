import { describe, expect, it, vi } from "vitest";
import { consumeRateLimit, describeWait, limitMessage, retryAfterHeader } from "./rate-limit";

const client = (result: unknown) => ({ rpc: vi.fn(async () => result) }) as never;

describe("consumeRateLimit", () => {
  it("asks the database function for the given action", async () => {
    const c = client({ data: [{ allowed: true, limit_window: null, retry_after_seconds: 0 }], error: null });
    expect(await consumeRateLimit(c, "voice")).toEqual({ allowed: true });
    expect((c as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalledWith("consume_rate_limit", { p_action: "voice" });
  });

  it("reports a refusal with its window and wait", async () => {
    const c = client({ data: [{ allowed: false, limit_window: "day", retry_after_seconds: 7200 }], error: null });
    expect(await consumeRateLimit(c, "chat")).toEqual({ allowed: false, window: "day", retryAfterSeconds: 7200 });
  });

  it("allows the request when the check itself fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await consumeRateLimit(client({ data: null, error: { message: "boom" } }), "chat")).toEqual({ allowed: true });
    expect(await consumeRateLimit({ rpc: vi.fn(async () => { throw new Error("down"); }) } as never, "chat")).toEqual({ allowed: true });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe("limit messages", () => {
  it.each([
    [30, "in a minute"],
    [600, "in about 10 minutes"],
    [3500, "in about 59 minutes"],
    [4000, "in about an hour"],
    [5 * 3600, "in about 5 hours"],
  ])("describes a %i second wait as %s", (seconds, text) => {
    expect(describeWait(seconds)).toBe(text);
  });

  it("points to 988 when a conversation is limited", () => {
    const limit = { allowed: false as const, window: "day" as const, retryAfterSeconds: 3 * 3600 };
    expect(limitMessage("chat", limit)).toContain("today's limit for messages");
    expect(limitMessage("chat", limit)).toContain("988");
    expect(limitMessage("voice", limit)).toContain("988");
    expect(limitMessage("export", limit)).not.toContain("988");
  });

  it("speaks of a short pause for the per-minute limit", () => {
    const limit = { allowed: false as const, window: "minute" as const, retryAfterSeconds: 40 };
    expect(limitMessage("chat", limit)).toContain("in a short time");
    expect(retryAfterHeader(limit)).toEqual({ "Retry-After": "40" });
  });
});
