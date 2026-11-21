import "server-only";
import sharp from "sharp";
import { KEEPSAKE_MAX_EDGE, MAX_UPLOAD_BYTES } from "./options";

export type ProcessedPhoto =
  | { ok: true; data: Buffer; width: number; height: number }
  | { ok: false; reason: "too_large" | "not_an_image" | "too_small" };

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MIN_EDGE = 64;

// Checks an upload is really a JPEG, PNG or WebP image (by its contents, not
// its name), then re-encodes it as a JPEG no larger than KEEPSAKE_MAX_EDGE.
// Re-encoding drops EXIF and other metadata, including GPS location.
export async function processKeepsakePhoto(input: Buffer): Promise<ProcessedPhoto> {
  if (input.byteLength > MAX_UPLOAD_BYTES) return { ok: false, reason: "too_large" };

  let format: string | undefined;
  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
    format = meta.format;
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch {
    return { ok: false, reason: "not_an_image" };
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) return { ok: false, reason: "not_an_image" };
  if (width < MIN_EDGE || height < MIN_EDGE) return { ok: false, reason: "too_small" };

  try {
    const { data, info } = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate() // apply the camera's orientation before the metadata is dropped
      .resize({ width: KEEPSAKE_MAX_EDGE, height: KEEPSAKE_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { ok: true, data, width: info.width, height: info.height };
  } catch {
    return { ok: false, reason: "not_an_image" };
  }
}
