import { getRegionResources } from "@/lib/safety/resources";

export function CrisisResources({ compact = false }: { compact?: boolean }) {
  const { emergency, resources } = getRegionResources();
  const list = compact ? resources.slice(0, 2) : resources;

  return (
    <div className="space-y-3">
      <a
        href={emergency.href}
        className="flex items-center justify-between gap-4 rounded-xl border border-ember/70 bg-alert-bg px-4 py-3 text-alert transition hover:border-alert"
      >
        <span>
          <span className="block font-medium">{emergency.action}</span>
          <span className="block text-sm opacity-80">{emergency.description}</span>
        </span>
      </a>
      <ul className={compact ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
        {list.map((r) => (
          <li key={r.name}>
            <a
              href={r.href}
              className="block rounded-xl border border-line bg-ink-2 px-4 py-3 transition hover:border-brass/60"
            >
              <span className="block font-medium text-cream">{r.action}</span>
              <span className="block text-sm text-sand">{r.name}</span>
              {!compact && <span className="mt-1 block text-sm text-dust">{r.description}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
