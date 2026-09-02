import type { CriterionStatus } from "@/lib/criteria";

const STATUS_META: Record<
  CriterionStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  good: { label: "Good", dot: "bg-good", text: "text-good", bg: "bg-good-bg" },
  needs_work: {
    label: "Needs Work",
    dot: "bg-needs-work",
    text: "text-needs-work",
    bg: "bg-needs-work-bg",
  },
  critical: {
    label: "Critical",
    dot: "bg-critical",
    text: "text-critical",
    bg: "bg-critical-bg",
  },
};

export function TrafficLight({ status }: { status: CriterionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
