"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock, Hourglass, XCircle } from "lucide-react";
import type { DoseStatus } from "@/lib/types";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";

const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-300 disabled:text-slate-600",
  secondary: "bg-white text-slate-900 border-2 border-slate-300 hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-slate-300",
  success: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-slate-300",
  warning: "bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:bg-slate-300",
  ghost: "text-slate-700 hover:bg-slate-200/70",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "min-h-9 px-3 text-sm", md: "min-h-11 px-4 text-base", lg: "min-h-14 px-6 text-lg" };
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        className,
      )}
    />
  );
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cx("rounded-2xl border border-slate-200 shadow-sm", !/(^|\s)bg-/.test(className ?? "") && "bg-white", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const STATUS_META: Record<DoseStatus | "due", { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "Pending", cls: "bg-slate-100 text-slate-800 border-slate-400", icon: Hourglass },
  due: { label: "Due now", cls: "bg-blue-700 text-white border-blue-800", icon: Clock },
  documented: { label: "Documented", cls: "bg-emerald-700 text-white border-emerald-800", icon: CheckCircle2 },
  overdue: { label: "Overdue", cls: "bg-red-700 text-white border-red-800", icon: AlertTriangle },
  exception: { label: "Exception", cls: "bg-amber-400 text-slate-950 border-amber-600", icon: XCircle },
};

export function StatusBadge({ status, dueNow, className }: { status: DoseStatus; dueNow?: boolean; className?: string }) {
  const key = status === "pending" && dueNow ? "due" : status;
  const m = STATUS_META[key];
  const Icon = m.icon;
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold whitespace-nowrap", m.cls, className)}>
      <Icon aria-hidden className="h-4 w-4" />
      {m.label}
    </span>
  );
}

const AVATAR_COLORS = ["bg-sky-700", "bg-violet-700", "bg-teal-700", "bg-rose-700", "bg-indigo-700", "bg-emerald-700", "bg-orange-700", "bg-fuchsia-700"];

export function Avatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const sizes = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-lg", lg: "h-20 w-20 text-3xl" };
  return (
    <span aria-hidden className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", AVATAR_COLORS[h % AVATAR_COLORS.length], sizes[size])}>
      {initials}
    </span>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-title"
      className={cx(
        "m-auto max-h-[92vh] w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl",
        wide ? "max-w-3xl" : "max-w-xl",
      )}
    >
      {open && (
        <div className="flex max-h-[92vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <h2 id="dialog-title" className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            <button onClick={onClose} className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100" aria-label="Close dialog">
              ×
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  variant = "primary",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  variant?: Variant;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-slate-700">{body}</div>
    </Dialog>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none";

export function ErrorNote({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 font-medium text-red-800">
      {error}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-600">{children}</div>;
}

export function Stat({ label, value, tone = "slate", hint }: { label: string; value: ReactNode; tone?: "slate" | "red" | "amber" | "green" | "blue"; hint?: string }) {
  const tones = {
    slate: "border-slate-300",
    red: "border-red-600",
    amber: "border-amber-500",
    green: "border-emerald-600",
    blue: "border-blue-600",
  };
  return (
    <div className={cx("rounded-2xl border-l-8 bg-white p-4 shadow-sm", tones[tone])}>
      <div className="text-sm font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="no-print mb-4 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "min-h-11 rounded-xl border-2 px-4 font-semibold",
            value === t.id ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
