import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AvatarPortrait } from "@/components/avatar-portrait";
import {
  AVATARS,
  avatarImagePath,
  DEFAULT_AVATAR,
  keepsakePath,
  parseCompanionChoice,
  resolveCompanionView,
} from "./options";
import { processKeepsakePhoto } from "./process-photo";

describe("companion options", () => {
  it("keeps each keepsake in its owner's folder", () => {
    expect(keepsakePath("abc")).toBe("abc/keepsake.jpg");
  });

  it.each([
    ["voice", { mode: "voice", avatar: null }],
    ["photo", { mode: "photo", avatar: null }],
    ["avatar:south-asian", { mode: "avatar", avatar: "south-asian" }],
    ["avatar:unknown", { mode: "avatar", avatar: DEFAULT_AVATAR }],
  ])("parses %s", (choice, expected) => {
    expect(parseCompanionChoice(choice)).toEqual(expected);
  });

  it.each([undefined, "", "hologram"])("rejects %s", (choice) => {
    expect(parseCompanionChoice(choice)).toBeNull();
  });

  it("falls back to voice when photo mode has no photo", () => {
    expect(resolveCompanionView({ mode: "photo", avatarId: null, photoUrl: null, caption: "Grandpa" })).toEqual({ mode: "voice" });
  });

  it("shows the photo with a trimmed caption", () => {
    expect(resolveCompanionView({ mode: "photo", avatarId: null, photoUrl: "https://x/y", caption: "  Coach Ray " })).toEqual({
      mode: "photo",
      photoUrl: "https://x/y",
      caption: "Coach Ray",
    });
  });

  it("uses the default avatar for an unknown id", () => {
    expect(resolveCompanionView({ mode: "avatar", avatarId: "nope", photoUrl: null, caption: null })).toEqual({
      mode: "avatar",
      avatarId: DEFAULT_AVATAR,
    });
  });
});

describe("avatar portraits", () => {
  it.each(AVATARS.map((a) => a.id))("%s has a square portrait file", async (id) => {
    const meta = await sharp(path.join(process.cwd(), "public", avatarImagePath(id))).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(meta.height);
    expect(meta.width).toBeGreaterThanOrEqual(400);
    expect(meta.exif).toBeUndefined();
  });

  it.each(AVATARS.map((a) => a.id))("%s renders as an image that says it is AI-generated", (id) => {
    const html = renderToStaticMarkup(createElement(AvatarPortrait, { id }));
    expect(html).toContain("<img");
    expect(html).toContain(encodeURIComponent(avatarImagePath(id)));
    expect(html).toMatch(/alt="[^"]*AI-generated[^"]*not a real person"/);
  });

  it("uses a given title as the alt text", () => {
    const html = renderToStaticMarkup(createElement(AvatarPortrait, { id: "white", title: "Test" }));
    expect(html).toContain('alt="Test"');
  });

  it("lists each background once", () => {
    expect(new Set(AVATARS.map((a) => a.background)).size).toBe(AVATARS.length);
  });
});

async function image(format: "jpeg" | "png" | "webp" | "gif", width = 300, height = 200) {
  const base = sharp({ create: { width, height, channels: 3, background: "#c99a5b" } });
  if (format === "jpeg") {
    return base.jpeg().withMetadata({ exif: { IFD0: { Copyright: "private" }, IFD3: { GPSLatitudeRef: "N" } } }).toBuffer();
  }
  return base.toFormat(format).toBuffer();
}

describe("processKeepsakePhoto", () => {
  it("re-encodes a JPEG and strips its metadata", async () => {
    const input = await image("jpeg");
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const result = await processKeepsakePhoto(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = await sharp(result.data).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.exif).toBeUndefined();
  });

  it.each(["png", "webp"] as const)("accepts %s and converts it to JPEG", async (format) => {
    const result = await processKeepsakePhoto(await image(format));
    expect(result.ok && (await sharp(result.data).metadata()).format).toBe("jpeg");
  });

  it("shrinks large photos to the keepsake size", async () => {
    const result = await processKeepsakePhoto(await image("png", 3000, 2000));
    expect(result).toMatchObject({ ok: true, width: 1000, height: 667 });
  });

  it("rejects formats other than JPEG, PNG and WebP", async () => {
    expect(await processKeepsakePhoto(await image("gif"))).toEqual({ ok: false, reason: "not_an_image" });
  });

  it("rejects files that aren't images, whatever they're called", async () => {
    expect(await processKeepsakePhoto(Buffer.from("<svg onload=alert(1)>"))).toEqual({ ok: false, reason: "not_an_image" });
  });

  it("rejects tiny images", async () => {
    expect(await processKeepsakePhoto(await image("png", 40, 40))).toEqual({ ok: false, reason: "too_small" });
  });

  it("rejects oversized uploads before decoding", async () => {
    expect(await processKeepsakePhoto(Buffer.alloc(4 * 1024 * 1024 + 1))).toEqual({ ok: false, reason: "too_large" });
  });
});
