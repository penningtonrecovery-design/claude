// How Fatherly Friend appears in conversations, and the rules for the
// keepsake photo. Shared by the server and the browser.

export const COMPANION_MODES = ["voice", "avatar", "photo"] as const;
export type CompanionMode = (typeof COMPANION_MODES)[number];

export const AVATARS = [
  { id: "cardigan", name: "The Cardigan", description: "Silver beard, warm cardigan, a listener's face." },
  { id: "flatcap", name: "The Flat Cap", description: "Glasses, flat cap, a craftsman's patience." },
  { id: "silverfox", name: "The Silver Fox", description: "Neat white hair, an easy, knowing smile." },
  { id: "warmsmile", name: "The Warm Smile", description: "Close-cropped grey hair, kind eyes, steady." },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export const DEFAULT_AVATAR: AvatarId = "cardigan";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_CAPTION_CHARS = 40;
// Longest edge of the stored keepsake, in pixels.
export const KEEPSAKE_MAX_EDGE = 1000;
// How long a link to the keepsake stays valid.
export const KEEPSAKE_LINK_SECONDS = 60 * 60;

export function isCompanionMode(value: unknown): value is CompanionMode {
  return typeof value === "string" && (COMPANION_MODES as readonly string[]).includes(value);
}

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATARS.some((a) => a.id === value);
}

// Every keepsake lives in a folder named after its owner, which is what the
// storage access rules check.
export function keepsakePath(userId: string): string {
  return `${userId}/keepsake.jpg`;
}

// "choice" is "voice", "photo" or "avatar:<id>".
export function parseCompanionChoice(choice: unknown): { mode: CompanionMode; avatar: AvatarId | null } | null {
  if (typeof choice !== "string") return null;
  const [mode, avatar] = choice.split(":");
  if (!isCompanionMode(mode)) return null;
  if (mode === "avatar") return { mode, avatar: isAvatarId(avatar) ? avatar : DEFAULT_AVATAR };
  return { mode, avatar: null };
}

export type CompanionView =
  | { mode: "voice" }
  | { mode: "avatar"; avatarId: AvatarId }
  | { mode: "photo"; photoUrl: string; caption: string | null };

// Works out what to show, falling back to the voice orb when a choice
// can't be honoured (for example a photo mode with no photo stored).
export function resolveCompanionView(input: {
  mode: unknown;
  avatarId: unknown;
  photoUrl: string | null;
  caption: string | null;
}): CompanionView {
  if (input.mode === "avatar") {
    return { mode: "avatar", avatarId: isAvatarId(input.avatarId) ? input.avatarId : DEFAULT_AVATAR };
  }
  if (input.mode === "photo" && input.photoUrl) {
    return { mode: "photo", photoUrl: input.photoUrl, caption: input.caption?.trim() || null };
  }
  return { mode: "voice" };
}
