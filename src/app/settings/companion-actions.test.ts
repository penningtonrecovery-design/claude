import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
const update = vi.fn();
const getCurrentUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("redirect"); }) }));

const { uploadKeepsake, setCompanionMode } = await import("./companion-actions");

function fakeSupabase(profile: Record<string, unknown> = {}) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: profile }),
  };
  return {
    storage: { from: () => ({ upload: (...args: unknown[]) => (upload(...args), { error: null }) }) },
    from: () => ({
      ...chain,
      update: (values: unknown) => {
        update(values);
        return { eq: async () => ({ error: null }) };
      },
    }),
  };
}

async function photoForm(opts: { rights?: boolean; caption?: string; bytes?: Buffer } = {}) {
  const bytes =
    opts.bytes ?? (await sharp({ create: { width: 200, height: 200, channels: 3, background: "#888" } }).png().toBuffer());
  const fd = new FormData();
  fd.set("photo", new File([new Uint8Array(bytes)], "me.png", { type: "image/png" }));
  if (opts.rights !== false) fd.set("rights", "on");
  if (opts.caption) fd.set("caption", opts.caption);
  return fd;
}

describe("uploadKeepsake", () => {
  afterEach(() => {
    upload.mockReset();
    update.mockReset();
    getCurrentUser.mockReset();
  });

  it("requires the rights confirmation", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    expect(await uploadKeepsake(undefined, await photoForm({ rights: false }))).toEqual({
      error: "Please confirm you have the right to use this photo.",
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it("refuses non-images without storing anything", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    const result = await uploadKeepsake(undefined, await photoForm({ bytes: Buffer.from("not an image at all") }));
    expect(result?.error).toMatch(/isn't a photo/);
    expect(upload).not.toHaveBeenCalled();
  });

  it("stores a re-encoded JPEG in the user's own folder and switches to photo mode", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "user-123" } });
    const result = await uploadKeepsake(undefined, await photoForm({ caption: "  Coach Ray  " }));
    expect(result?.ok).toBeTruthy();
    const [path, data, options] = upload.mock.calls[0];
    expect(path).toBe("user-123/keepsake.jpg");
    expect((await sharp(data as Buffer).metadata()).format).toBe("jpeg");
    expect(options).toEqual({ contentType: "image/jpeg", upsert: true });
    expect(update.mock.calls[0][0]).toMatchObject({
      keepsake_path: "user-123/keepsake.jpg",
      keepsake_caption: "Coach Ray",
      companion_mode: "photo",
    });
  });

  it("rejects a caption that is too long", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    const result = await uploadKeepsake(undefined, await photoForm({ caption: "x".repeat(41) }));
    expect(result?.error).toMatch(/40 characters/);
  });
});

describe("setCompanionMode", () => {
  afterEach(() => update.mockReset());

  it("won't switch to photo mode without a photo", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase({ keepsake_path: null }), user: { id: "u1" } });
    const fd = new FormData();
    fd.set("choice", "photo");
    expect(await setCompanionMode(undefined, fd)).toEqual({ error: "Add a photo first, below." });
    expect(update).not.toHaveBeenCalled();
  });

  it("saves an avatar choice", async () => {
    getCurrentUser.mockResolvedValue({ supabase: fakeSupabase(), user: { id: "u1" } });
    const fd = new FormData();
    fd.set("choice", "avatar:latino");
    expect(await setCompanionMode(undefined, fd)).toEqual({ ok: "Saved." });
    expect(update.mock.calls[0][0]).toEqual({ companion_mode: "avatar", avatar_id: "latino" });
  });
});
