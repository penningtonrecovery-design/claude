import Image from "next/image";
import { avatarImagePath, avatarInfo, type AvatarId } from "@/lib/companion/options";

// A photo-style portrait of a grandfather who doesn't exist (AI-generated).
// The caller sizes it with className; it fills that box as a circle.
export function AvatarPortrait({
  id,
  className = "",
  title,
  priority = false,
}: {
  id: AvatarId;
  className?: string;
  title?: string;
  priority?: boolean;
}) {
  const info = avatarInfo(id);
  return (
    <span className={`relative block overflow-hidden rounded-full bg-ink-3 ${className}`}>
      <Image
        src={avatarImagePath(info.id)}
        alt={title ?? `${info.name}: AI-generated portrait of a grandfather, not a real person`}
        fill
        sizes="(min-width: 640px) 208px, 176px"
        className="object-cover"
        priority={priority}
      />
    </span>
  );
}
