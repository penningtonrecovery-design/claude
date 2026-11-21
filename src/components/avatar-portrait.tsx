import type { AvatarId } from "@/lib/companion/options";

// Illustrated grandfather portraits. Deliberately simple and stylized: they
// should read as illustrations of a character, never as a real person.

type Look = {
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  clothing: string;
  clothingShade: string;
  collar: string;
  background: [string, string];
};

const LOOKS: Record<AvatarId, Look> = {
  cardigan: {
    skin: "#e7b892",
    skinShade: "#cf9a74",
    hair: "#dcd6cd",
    hairShade: "#bdb5aa",
    clothing: "#7a4b2e",
    clothingShade: "#5e3820",
    collar: "#efe6d8",
    background: ["#3a2a1e", "#1c1713"],
  },
  flatcap: {
    skin: "#c48a60",
    skinShade: "#a8714a",
    hair: "#b9b2a7",
    hairShade: "#9c9488",
    clothing: "#3f4a3a",
    clothingShade: "#2d3629",
    collar: "#d9cdb8",
    background: ["#2c3326", "#171a14"],
  },
  silverfox: {
    skin: "#f0caa6",
    skinShade: "#d8ab86",
    hair: "#efebe4",
    hairShade: "#d2ccc2",
    clothing: "#33405a",
    clothingShade: "#232d42",
    collar: "#f1e8da",
    background: ["#26303f", "#14171d"],
  },
  warmsmile: {
    skin: "#8b5a3b",
    skinShade: "#734629",
    hair: "#aaa49b",
    hairShade: "#8d877e",
    clothing: "#8a3f2c",
    clothingShade: "#6c2f1f",
    collar: "#e9dcc6",
    background: ["#3b2219", "#1c1311"],
  },
};

export function AvatarPortrait({
  id,
  className = "",
  title,
}: {
  id: AvatarId;
  className?: string;
  title?: string;
}) {
  const l = LOOKS[id];
  const gid = `bg-${id}`;
  const cid = `clip-${id}`;
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ?? "Illustrated grandfather"}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor={l.background[0]} />
          <stop offset="100%" stopColor={l.background[1]} />
        </radialGradient>
        <clipPath id={cid}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cid})`}>
      <circle cx="100" cy="100" r="100" fill={`url(#${gid})`} />

      {/* Shoulders and clothing */}
      <path d="M30 200 C32 160 60 140 100 140 C140 140 168 160 170 200 Z" fill={l.clothing} />
      <path d="M100 140 L84 200 L116 200 Z" fill={l.collar} />
      <path d="M100 146 L88 200 M100 146 L112 200" stroke={l.clothingShade} strokeWidth="3" fill="none" />
      {id === "cardigan" && (
        <g fill={l.clothingShade}>
          <circle cx="92" cy="172" r="2.5" />
          <circle cx="92" cy="188" r="2.5" />
        </g>
      )}

      {/* Neck */}
      <path d="M86 118 L86 142 Q100 150 114 142 L114 118 Z" fill={l.skinShade} />

      {/* Ears */}
      <ellipse cx="62" cy="96" rx="7" ry="11" fill={l.skinShade} />
      <ellipse cx="138" cy="96" rx="7" ry="11" fill={l.skinShade} />

      {/* Head */}
      <ellipse cx="100" cy="92" rx="38" ry="44" fill={l.skin} />

      {/* Hair */}
      {id === "cardigan" && (
        <path d="M64 86 C62 60 80 46 100 46 C120 46 138 60 136 86 C130 72 122 66 100 66 C80 66 70 72 64 86 Z" fill={l.hair} />
      )}
      {id === "silverfox" && (
        <path d="M62 90 C58 56 82 42 104 44 C128 46 142 62 138 90 C134 70 120 60 98 62 C84 63 74 70 70 80 L66 92 Z" fill={l.hair} />
      )}
      {id === "warmsmile" && (
        <path d="M64 82 C66 60 82 50 100 50 C118 50 134 60 136 82 C128 70 116 64 100 64 C84 64 72 70 64 82 Z" fill={l.hair} />
      )}
      {id === "flatcap" && (
        <g>
          <path d="M64 92 C64 84 66 78 70 74 L70 92 Z M136 92 C136 84 134 78 130 74 L130 92 Z" fill={l.hair} />
          <path d="M60 74 C62 50 84 42 104 44 C124 46 140 56 140 72 Z" fill="#6b5a45" />
          <path d="M58 74 C80 66 120 64 150 74 C140 80 70 82 58 74 Z" fill="#584a38" />
        </g>
      )}

      {/* Age lines: forehead and smile creases */}
      <g stroke={l.skinShade} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7">
        {id !== "flatcap" && <path d="M86 70 Q100 66 114 70" />}
        {id !== "flatcap" && <path d="M90 64 Q100 61 110 64" />}
        <path d="M70 92 Q68 95 70 98" />
        <path d="M130 92 Q132 95 130 98" />
        {id !== "cardigan" && <path d="M84 112 Q82 118 86 124" />}
        {id !== "cardigan" && <path d="M116 112 Q118 118 114 124" />}
      </g>

      {/* Brows */}
      <g stroke={l.hairShade} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M78 80 Q86 76 94 79" />
        <path d="M106 79 Q114 76 122 80" />
      </g>

      {/* Eyes: soft, smiling */}
      <g stroke="#3a2a20" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M80 92 Q86 87 92 92" />
        <path d="M108 92 Q114 87 120 92" />
      </g>

      {/* Glasses */}
      {id === "flatcap" && (
        <g stroke="#2a2018" strokeWidth="2.5" fill="none">
          <circle cx="86" cy="92" r="11" />
          <circle cx="114" cy="92" r="11" />
          <path d="M97 92 L103 92" />
        </g>
      )}

      {/* Nose */}
      <path d="M100 94 Q96 106 100 109 Q103 110 105 108" stroke={l.skinShade} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Cheeks */}
      <circle cx="78" cy="106" r="6" fill="#d9826b" opacity="0.18" />
      <circle cx="122" cy="106" r="6" fill="#d9826b" opacity="0.18" />

      {/* Beard, moustache or smile */}
      {id === "cardigan" && (
        <path d="M66 100 C66 128 82 140 100 140 C118 140 134 128 134 100 C128 112 120 116 100 116 C80 116 72 112 66 100 Z" fill={l.hair} />
      )}
      {(id === "cardigan" || id === "flatcap") && (
        <path d="M86 114 C92 108 108 108 114 114 C108 117 92 117 86 114 Z" fill={id === "cardigan" ? l.hairShade : l.hair} />
      )}
      {id !== "cardigan" && (
        <path d="M88 120 Q100 128 112 120" stroke="#5a3524" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {id === "warmsmile" && (
        <path d="M74 112 C76 132 88 140 100 140 C112 140 124 132 126 112 C120 126 110 130 100 130 C90 130 80 126 74 112 Z" fill={l.hair} opacity="0.55" />
      )}
      </g>
    </svg>
  );
}
